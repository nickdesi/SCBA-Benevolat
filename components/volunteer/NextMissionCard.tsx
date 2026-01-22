import React, { useState } from 'react';
import { UserRegistration } from '../../types';
import { User } from 'firebase/auth';
import { Clock, MapPin, AlertCircle, Trash2 } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';

interface NextMissionCardProps {
    registration: UserRegistration;
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    user: User;
}

export const NextMissionCard: React.FC<NextMissionCardProps> = ({ registration, onUnsubscribe, user }) => {
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleUnsubscribe = () => {
        setConfirmOpen(true);
    };

    return (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl p-6 sm:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-[80px] opacity-20 translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-xs font-bold text-indigo-200 mb-3">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        PROCHAINE MISSION
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
                        {registration.team} <span className="text-indigo-400">vs</span> {registration.opponent}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            {registration.gameDate} à {registration.gameTime}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-indigo-400" />
                            {registration.location}
                        </div>
                    </div>
                </div>

                {/* Role + Cancel on same row */}
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs uppercase text-slate-400 font-bold mb-1">Votre Rôle</p>
                        <div className="inline-block px-4 py-2 bg-indigo-600 rounded-xl font-bold shadow-lg shadow-indigo-900/50 transform rotate-1">
                            {registration.roleName}
                        </div>
                    </div>
                    <button
                        onClick={handleUnsubscribe}
                        className="flex-shrink-0 p-2 rounded-xl 
                                   bg-red-500/10 hover:bg-red-500/20 
                                   border border-red-500/30 hover:border-red-500/50
                                   text-red-400 hover:text-red-300 
                                   transition-all duration-150 
                                   cursor-pointer"
                        title="Annuler ma participation"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={() => {
                    onUnsubscribe(registration.gameId, registration.roleId, registration.volunteerName || user.displayName || "");
                    setConfirmOpen(false);
                }}
                title="Annuler ma venue ?"
                message="Êtes-vous sûr de vouloir annuler votre participation à ce match ?"
                confirmText="Confirmer l'annulation"
                confirmStyle="danger"
            />
        </div>
    );
};
