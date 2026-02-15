import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import type { Game, UserRegistration, CarpoolEntry } from '../types';
import { VolunteerDashboard } from './volunteer/VolunteerDashboard';
import type { UserCarpoolRegistration } from '../utils/useCarpoolRegistrations';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    registrations: UserRegistration[];
    games: Game[];
    userCarpools: UserCarpoolRegistration[];
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    onRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
    onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
    allTeams: string[];
    favoriteTeams: string[];
    onToggleFavorite: (team: string) => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    onClose,
    user,
    registrations,
    games,
    userCarpools,
    onUnsubscribe,
    onRemoveCarpool,
    onToast,
    allTeams,
    favoriteTeams,
    onToggleFavorite
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-4xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
                    >
                        <VolunteerDashboard
                            user={user}
                            registrations={registrations}
                            games={games}
                            userCarpools={userCarpools}
                            onClose={onClose}
                            onUnsubscribe={onUnsubscribe}
                            onRemoveCarpool={onRemoveCarpool}
                            onToast={onToast}
                            allTeams={allTeams}
                            favoriteTeams={favoriteTeams}
                            onToggleFavorite={onToggleFavorite}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProfileModal;
