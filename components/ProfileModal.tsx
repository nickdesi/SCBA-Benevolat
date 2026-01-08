import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User } from 'firebase/auth';
import { UserRegistration, Game, CarpoolEntry } from '../types';
import { CalendarIcon, ClockIcon, LocationIcon, DeleteIcon } from './Icons';
import ConfirmModal from './ConfirmModal';
import { getNotificationPermission, requestNotificationPermission, sendLocalNotification, getNotificationPreference, setNotificationPreference } from '../utils/notifications';
import useScrollLock from '../utils/useScrollLock';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    registrations: UserRegistration[];
    games: Game[];
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    onRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
    onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    onClose,
    user,
    registrations,
    games,
    onUnsubscribe,
    onRemoveCarpool,
    onToast
}) => {
    useScrollLock(isOpen);

    // State for revealing contact info
    const [revealedContacts, setRevealedContacts] = useState<Set<string>>(new Set());

    // State for notification permission
    const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>('default');
    const [notifEnabled, setNotifEnabled] = useState(false);

    // Check notification permission and preference on mount
    useEffect(() => {
        setNotificationStatus(getNotificationPermission());
        setNotifEnabled(getNotificationPreference());
    }, [isOpen]);

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

    // User's own carpool registrations (where their name appears)
    const myCarpoolEntries = useMemo(() => {
        const entries: { game: Game; entry: CarpoolEntry }[] = [];
        const userName = user.displayName || '';

        games.forEach(game => {
            if (game.carpool) {
                game.carpool.forEach(entry => {
                    if (entry.name.toLowerCase().includes(userName.toLowerCase()) ||
                        userName.toLowerCase().includes(entry.name.toLowerCase())) {
                        entries.push({ game, entry });
                    }
                });
            }
        });

        return entries.sort((a, b) => a.game.dateISO.localeCompare(b.game.dateISO));
    }, [games, user.displayName]);

    // Carpool opportunities for games where user is registered as volunteer
    const carpoolOpportunities = useMemo(() => {
        const opportunities: { game: Game; drivers: CarpoolEntry[] }[] = [];
        const registeredGameIds = new Set(registrations.map(r => r.gameId));
        const userName = user.displayName || '';

        games.forEach(game => {
            if (registeredGameIds.has(game.id) && !game.isHome && game.carpool) {
                // Filter drivers with available seats, excluding self
                const drivers = game.carpool.filter(entry =>
                    entry.type === 'driver' &&
                    (entry.seats || 0) > 0 &&
                    !entry.name.toLowerCase().includes(userName.toLowerCase())
                );
                if (drivers.length > 0) {
                    opportunities.push({ game, drivers });
                }
            }
        });

        return opportunities.sort((a, b) => a.game.dateISO.localeCompare(b.game.dateISO));
    }, [games, registrations, user.displayName]);

    const toggleRevealContact = (entryId: string) => {
        setRevealedContacts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entryId)) {
                newSet.delete(entryId);
            } else {
                newSet.add(entryId);
            }
            return newSet;
        });
    };

    // Confirm Modal State
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        confirmStyle?: 'danger' | 'primary';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const handleDelete = (regId: string, gameId: string, roleId: string, volunteerName?: string, isValid: boolean = true) => {
        setConfirmConfig({
            isOpen: true,
            title: isValid ? "Annuler l'inscription ?" : "Supprimer l'inscription ?",
            message: isValid
                ? "Voulez-vous vraiment annuler cette inscription ?"
                : "Voulez-vous supprimer cette inscription obsolète de votre profil ?",
            confirmText: isValid ? "Annuler l'inscription" : "Supprimer",
            confirmStyle: 'danger',
            onConfirm: async () => {
                try {
                    await onUnsubscribe(gameId, roleId, volunteerName || user.displayName || "");
                    onToast('Désinscription réussie', 'success');
                } catch (err) {
                    console.error(err);
                    onToast('Erreur lors de la désinscription', 'error');
                }
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleCarpoolDelete = (gameId: string, entryId: string) => {
        setConfirmConfig({
            isOpen: true,
            title: "Annuler le covoiturage ?",
            message: "Voulez-vous vraiment annuler ce covoiturage ?",
            confirmText: "Annuler covoiturage",
            confirmStyle: 'danger',
            onConfirm: async () => {
                try {
                    await onRemoveCarpool(gameId, entryId);
                    onToast('Covoiturage annulé', 'success');
                } catch (err) {
                    onToast('Erreur lors de l\'annulation', 'error');
                }
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-premium transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">


                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/50 flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg flex-shrink-0">
                            {user.photoURL ? (
                                <img src={user.photoURL} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                                user.displayName?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="flex-grow min-w-0">
                            <h2 className="text-xl font-bold truncate">{user.displayName}</h2>
                            <p className="text-indigo-100 text-sm truncate">{user.email}</p>
                            <div className="flex gap-2 mt-2">
                                <div className="px-2 py-0.5 bg-white/10 rounded-lg text-xs font-medium backdrop-blur-sm border border-white/10">
                                    {registrations.length} Inscriptions
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors self-start flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-800">
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

                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-6 mb-3 flex items-center gap-2">
                        <span>🔔</span> Notifications
                    </h3>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3 border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Alertes de match</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {notificationStatus === 'denied'
                                        ? 'Bloquées par le navigateur.'
                                        : notifEnabled ? 'Rappel 2h avant.' : 'Désactivées.'}
                                </p>
                            </div>
                            {notificationStatus === 'denied' ? (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold flex-shrink-0">
                                    ✗ Bloquées
                                </span>
                            ) : notificationStatus === 'unsupported' ? (
                                <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex-shrink-0">
                                    Non supporté
                                </span>
                            ) : notificationStatus === 'granted' && notifEnabled ? (
                                <button
                                    onClick={() => {
                                        setNotificationPreference(false);
                                        setNotifEnabled(false);
                                        onToast('Notifications désactivées', 'info');
                                    }}
                                    className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex-shrink-0 hover:bg-emerald-200 transition-colors cursor-pointer"
                                >
                                    ✓ Activées
                                </button>
                            ) : (
                                <button
                                    onClick={async () => {
                                        if (notificationStatus !== 'granted') {
                                            const granted = await requestNotificationPermission();
                                            setNotificationStatus(getNotificationPermission());
                                            if (!granted) return;
                                        }
                                        setNotificationPreference(true);
                                        setNotifEnabled(true);
                                        sendLocalNotification('🔔 Notifications activées !', {
                                            body: 'Vous recevrez un rappel avant vos matchs.'
                                        });
                                        onToast('Notifications activées', 'success');
                                    }}
                                    className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm flex-shrink-0"
                                >
                                    Activer
                                </button>
                            )}
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
                        <span>🚗</span> Mes Covoiturages
                    </h3>

                    {myCarpoolEntries.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-500 text-sm text-center">
                            Vous n'êtes inscrit à aucun covoiturage pour le moment.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myCarpoolEntries.map(({ game, entry }) => (
                                <div key={entry.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase ${entry.type === 'driver'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {entry.type === 'driver' ? '🚘 Conducteur' : '👤 Passager'}
                                                </span>
                                                {entry.type === 'driver' && entry.seats && (
                                                    <span className="text-xs text-slate-500">{entry.seats} place(s)</span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-slate-800">{game.team} vs {game.opponent}</h4>
                                            <p className="text-xs text-slate-500">{game.date} • {game.time}</p>
                                            {entry.departureLocation && (
                                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                    <LocationIcon className="w-3 h-3" /> Départ: {entry.departureLocation}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleCarpoolDelete(game.id, entry.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Annuler"
                                        >
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Carpool Opportunities */}
                    {carpoolOpportunities.length > 0 && (
                        <>
                            <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
                                <span>💡</span> Opportunités de Covoiturage
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">
                                Pour les matchs extérieurs où vous êtes inscrit(e), voici les conducteurs proposant des places :
                            </p>
                            <div className="space-y-4">
                                {carpoolOpportunities.map(({ game, drivers }) => (
                                    <div key={game.id} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                        <h4 className="font-bold text-slate-800 mb-1">{game.team} vs {game.opponent}</h4>
                                        <p className="text-xs text-slate-500 mb-3">{game.date} • {game.time} • {game.location}</p>

                                        <div className="space-y-2">
                                            {drivers.map(driver => (
                                                <div key={driver.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                                                    <div>
                                                        <p className="font-medium text-slate-800">{driver.name}</p>
                                                        <p className="text-xs text-emerald-600 font-bold">
                                                            🚘 {driver.seats} place(s) disponible(s)
                                                        </p>
                                                        {driver.departureLocation && (
                                                            <p className="text-xs text-slate-400">Départ: {driver.departureLocation}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        {revealedContacts.has(driver.id) ? (
                                                            <a
                                                                href={`tel:${driver.phone}`}
                                                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                                                            >
                                                                📞 {driver.phone || 'Non renseigné'}
                                                            </a>
                                                        ) : (
                                                            <button
                                                                onClick={() => toggleRevealContact(driver.id)}
                                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                                            >
                                                                Contacter
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText || "Confirmer"}
                cancelText={confirmConfig.cancelText || "Annuler"}
                confirmStyle={confirmConfig.confirmStyle || "primary"}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>,
        document.body
    );
};

export default ProfileModal;
