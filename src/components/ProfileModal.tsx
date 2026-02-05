import React from 'react';
import { createPortal } from 'react-dom';
import { User } from 'firebase/auth';
import { UserRegistration, Game } from '../types';
import useScrollLock from '../utils/useScrollLock';
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
    onToast: (message: string, type: 'success' | 'error' | 'info') => void;
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
    useScrollLock(isOpen);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-40 flex items-center justify-center p-0 sm:p-4 pb-20 sm:pb-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-premium transition-opacity" onClick={onClose} />

            <div className="relative w-full h-full sm:h-[85vh] sm:max-w-5xl bg-slate-50 dark:bg-slate-900 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                <VolunteerDashboard
                    user={user}
                    registrations={registrations}
                    games={games}
                    userCarpools={userCarpools}
                    onClose={onClose}
                    onUnsubscribe={onUnsubscribe}
                    onRemoveCarpool={onRemoveCarpool}
                    allTeams={allTeams}
                    favoriteTeams={favoriteTeams}
                    onToggleFavorite={onToggleFavorite}
                />
            </div>
        </div>,
        document.body
    );
};

export default ProfileModal;
