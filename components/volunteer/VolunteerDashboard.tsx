import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { UserRegistration, Game } from '../../types';
import { X, LayoutDashboard, MessageCircle, Trophy, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardHome } from './DashboardHome';
import { DashboardComm } from './DashboardCommunications';

interface VolunteerDashboardProps {
    user: User;
    registrations: UserRegistration[];
    games: Game[];
    onClose: () => void;
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    allTeams: string[];
    favoriteTeams: string[];
    onToggleFavorite: (team: string) => Promise<void>;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({
    user,
    registrations,
    games,
    onClose,
    onUnsubscribe,
    allTeams,
    favoriteTeams,
    onToggleFavorite
}) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'communication'>('dashboard');

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
            {/* Header / Nav */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm z-10 flex items-center justify-between">
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

                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' ? (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="p-4 sm:p-6 pb-24"
                        >
                            <DashboardHome
                                registrations={registrations}
                                games={games}
                                onUnsubscribe={onUnsubscribe}
                                allTeams={allTeams}
                                favoriteTeams={favoriteTeams}
                                onToggleFavorite={onToggleFavorite}
                                user={user}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="communication"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="p-4 sm:p-6 pb-24"
                        >
                            <DashboardComm />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
