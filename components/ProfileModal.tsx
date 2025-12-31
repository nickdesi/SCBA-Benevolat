import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { User } from 'firebase/auth';
import { UserRegistration, Game } from '../types';
import { CalendarIcon, ClockIcon, LocationIcon, DeleteIcon } from './Icons';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    registrations: UserRegistration[];
    games: Game[];
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    onClose,
    user,
    registrations,
    games,
    onUnsubscribe
}) => {

    const processedRegistrations = useMemo(() => {
        return registrations.map(reg => {
            const game = games.find(g => g.id === reg.gameId);
            let isValid = true;

            if (game) {
                const role = game.roles.find(r => r.id === reg.roleId);
                if (role) {
                    const nameToCheck = reg.volunteerName || user.displayName;
                    if (nameToCheck && !role.volunteers.includes(nameToCheck)) {
                        isValid = false;
                    }
                } else {
                    isValid = false;
                }
            }

            return { ...reg, isValid };
        }).sort((a, b) => {
            if (a.gameDateISO && b.gameDateISO) {
                return a.gameDateISO.localeCompare(b.gameDateISO);
            }
            return 0;
        });
    }, [registrations, games, user.displayName]);

    const handleDelete = async (regId: string, gameId: string, roleId: string, volunteerName?: string, isValid: boolean = true) => {
        const confirmMessage = isValid
            ? "Voulez-vous vraiment annuler cette inscription ?"
            : "Voulez-vous supprimer cette inscription obsolète de votre profil ?";

        if (!confirm(confirmMessage)) return;

        try {
            await onUnsubscribe(gameId, roleId, volunteerName || user.displayName || "");
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression");
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/50 flex items-center justify-center text-3xl font-bold shadow-lg">
                            {user.photoURL ? (
                                <img src={user.photoURL} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                                user.displayName?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{user.displayName}</h2>
                            <p className="text-indigo-100">{user.email}</p>
                            <div className="flex gap-3 mt-4">
                                <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-medium backdrop-blur-sm border border-white/10">
                                    {registrations.length} Inscriptions
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="ml-auto p-2 hover:bg-white/10 rounded-full transition-colors self-start -mt-2 -mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span>📅</span> Mes Prochaines Missions
                    </h3>

                    {processedRegistrations.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-100 border-dashed">
                            <p className="text-slate-400">Aucune inscription pour le moment.</p>
                            <button onClick={onClose} className="mt-4 text-indigo-600 font-bold hover:underline">
                                Parcourir les matchs
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {processedRegistrations.map(reg => {
                                const isValid = reg.isValid !== false;
                                return (
                                    <div key={reg.id} className={`p-4 rounded-2xl shadow-sm border flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow group
                                    ${isValid ? 'bg-white border-slate-100' : 'bg-red-50 border-red-100 opacity-90'}
                                `}>
                                        <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center
                                        ${isValid ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-500'}
                                    `}>
                                            <span className="text-xs font-bold uppercase">
                                                {reg.gameDate ? (reg.gameDate.includes('-') ? 'DATE' : reg.gameDate.split(' ')[0].substring(0, 3)) : '???'}
                                            </span>
                                            <span className="text-xl font-black">
                                                {reg.gameDate ? (reg.gameDate.includes('-') ? reg.gameDate.split('-')[2] : reg.gameDate.match(/\d+/)?.[0]) : '?'}
                                            </span>
                                        </div>

                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide
                                                ${isValid ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}
                                            `}>
                                                    {reg.roleName}
                                                </span>
                                                {!isValid && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                                        ⚠️ Expiré / Invalide
                                                    </span>
                                                )}
                                                <span className="text-slate-400 text-xs flex items-center gap-1">
                                                    <ClockIcon className="w-3 h-3" /> {reg.gameTime || 'Heure à définir'}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-slate-800">
                                                {reg.team} vs {reg.opponent}
                                            </h4>
                                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                <LocationIcon className="w-3 h-3" /> {reg.location}
                                            </p>
                                        </div>

                                        <div className="flex-shrink-0 flex sm:flex-col gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDelete(reg.id, reg.gameId, reg.roleId, reg.volunteerName, isValid)}
                                                className={`p-2 rounded-lg transition-colors
                                                ${isValid ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}
                                            `}
                                                title={isValid ? "Annuler l'inscription" : "Supprimer de l'historique"}
                                            >
                                                <DeleteIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
                        <span>🔔</span> Notifications
                    </h3>
                    <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-slate-800">Alertes de match</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Recevez un rappel 2h avant le début de votre mission.
                                </p>
                            </div>
                            <button
                                onClick={async () => {
                                    const { requestNotificationPermission, sendLocalNotification } = await import('../utils/notifications');
                                    const granted = await requestNotificationPermission();
                                    if (granted) {
                                        sendLocalNotification('🔔 Notifications activées !', {
                                            body: 'Vous recevrez un rappel avant vos prochains matchs.'
                                        });
                                    } else {
                                        alert("Permission refusée. Veuillez activer les notifications dans les réglages de votre navigateur.");
                                    }
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md"
                            >
                                Activer
                            </button>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
                        <span>🚗</span> Covoiturage
                    </h3>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-800 text-sm">
                        La gestion de vos covoiturages arrive bientôt ici !
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProfileModal;
