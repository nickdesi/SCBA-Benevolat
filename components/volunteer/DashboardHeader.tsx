import React from 'react';
import { User } from 'firebase/auth';
import { X, LayoutDashboard, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="relative flex-shrink-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-xl z-10 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-4">
                {/* User Info */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-indigo-500/30"
                    >
                        <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-lg text-indigo-400">
                                    {user.displayName?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </motion.div>
                    <div className="hidden xs:block">
                        <h2 className="text-base sm:text-lg font-bold leading-tight text-white">{user.displayName}</h2>
                        <p className="text-xs text-slate-400 font-medium">Bénévole SCBA</p>
                    </div>
                </motion.div>

                {/* Navigation Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex bg-slate-800/60 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-700/50 backdrop-blur-sm"
                >
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'dashboard'
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="hidden sm:inline">Tableau de bord</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('communication')}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'communication'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Communication</span>
                    </button>
                </motion.div>

                {/* Close Button */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
            </div>
        </div>
    );
};
