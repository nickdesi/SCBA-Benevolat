import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { UserRegistration, Game } from '../../types';
import { X, LayoutDashboard, MessageCircle, Trophy, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardHome } from './DashboardHome';
import { DashboardComm } from './DashboardCommunications';
import { DashboardHeader } from './DashboardHeader';
import type { UserCarpoolRegistration } from '../../utils/useCarpoolRegistrations';

interface VolunteerDashboardProps {
    user: User;
    registrations: UserRegistration[];
    games: Game[];
    userCarpools: UserCarpoolRegistration[];
    onClose: () => void;
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    onRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
    allTeams: string[];
    favoriteTeams: string[];
    onToggleFavorite: (team: string) => Promise<void>;
    onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({
    user,
    registrations,
    games,
    userCarpools,
    onClose,
    onUnsubscribe,
    onRemoveCarpool,
    allTeams,
    favoriteTeams,
    onToggleFavorite,
    onToast
}) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'communication'>('dashboard');

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
            {/* Header / Nav */}
            {/* Header / Nav */}
            <DashboardHeader
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onClose={onClose}
                onToast={onToast}
            />

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
                                userCarpools={userCarpools}
                                onUnsubscribe={onUnsubscribe}
                                onRemoveCarpool={onRemoveCarpool}
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
