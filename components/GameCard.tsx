import React, { memo, useRef, useEffect, Suspense, lazy, useState } from 'react';
import type { Game, CarpoolEntry } from '../types';
import VolunteerSlot from './VolunteerSlot';
import CarpoolingSection from './CarpoolingSection';
import ConfirmModal from './ConfirmModal';
import { CalendarIcon, ClockIcon, LocationIcon, EditIcon, DeleteIcon, GoogleCalendarIcon, OutlookCalendarIcon, AppleCalendarIcon, MotionIconWrapper } from './Icons';
import { downloadGameCalendar, getGoogleCalendarUrl, getOutlookCalendarUrl } from '../utils/calendar';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy-loaded for code-splitting
const GameForm = lazy(() => import('./GameForm'));

interface GameCardProps {
    game: Game;
    onVolunteer: (gameId: string, roleId: string, parentName: string) => void;
    onRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => void;
    onUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => void;
    onAddCarpool: (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => void;
    onRemoveCarpool: (gameId: string, entryId: string) => void;
    onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
    isAdmin: boolean;
    isEditing: boolean;
    onEditRequest: () => void;
    onCancelEdit: () => void;
    onDeleteRequest: () => void;
    onUpdateRequest: (game: Game) => void;
    userRegistrations?: Map<string, string>;
    isAuthenticated?: boolean;
}

// Check if a role is considered "complete"
const isRoleComplete = (role: { capacity: number; volunteers: string[] }): boolean => {
    const isUnlimited = role.capacity === Infinity || role.capacity === 0;
    if (isUnlimited) {
        return role.volunteers.length >= 2;
    }
    return role.volunteers.length >= role.capacity;
};

// Check if all roles in a game are complete
const isGameFullyStaffed = (game: Game): boolean => {
    return game.roles.every(isRoleComplete);
};

// Chevron Icon for Accordion
const ChevronIcon: React.FC<{ className?: string; isOpen: boolean }> = ({ className, isOpen }) => (
    <motion.svg
        animate={{ rotate: isOpen ? 180 : 0 }}
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </motion.svg>
);

const GameCard: React.FC<GameCardProps> = memo(({
    game,
    onVolunteer,
    onRemoveVolunteer,
    onUpdateVolunteer,
    onAddCarpool,
    onRemoveCarpool,
    onToast,
    isAdmin,
    isEditing,
    onEditRequest,
    onCancelEdit,
    onDeleteRequest,
    onUpdateRequest,
    userRegistrations,
    isAuthenticated,
}) => {
    // Accordion state - Default expanded if urgent
    const [isExpanded, setIsExpanded] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isFullyStaffed = isGameFullyStaffed(game);
    const totalVolunteers = game.roles.reduce((sum, r) => sum + r.volunteers.length, 0);
    const totalCapacity = game.roles.reduce((sum, r) => {
        const isUnlimited = r.capacity === Infinity || r.capacity === 0;
        return sum + (isUnlimited ? 2 : r.capacity); // Target 2 for unlimited
    }, 0);

    const totalCarpoolSeats = React.useMemo(() => {
        if (!game.carpool) return 0;
        return game.carpool
            .filter(e => e.type === 'driver')
            .reduce((sum, driver) => sum + (driver.seats || 0), 0);
    }, [game.carpool]);

    const isHomeGame = game.isHome ?? true;

    // Calendar picker state
    const [showCalendarPicker, setShowCalendarPicker] = React.useState(false);
    const calendarPickerRef = useRef<HTMLDivElement>(null);

    // Close calendar picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarPickerRef.current && !calendarPickerRef.current.contains(event.target as Node)) {
                setShowCalendarPicker(false);
            }
        };
        if (showCalendarPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCalendarPicker]);

    const isUrgent = React.useMemo(() => {
        if (!isHomeGame) return false;
        if (isFullyStaffed) return false;
        try {
            const gameDate = new Date(game.dateISO);
            const now = new Date();
            const diffMs = gameDate.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            // Urgent if within 48h (to be safe/visible) and not fully staffed
            return diffHours > 0 && diffHours < 48;
        } catch {
            return false;
        }
    }, [game.dateISO, isFullyStaffed]);

    // Create Calendar Links
    const handleGoogleCalendar = () => {
        const url = getGoogleCalendarUrl(game);
        if (url) window.open(url, '_blank');
        setShowCalendarPicker(false);
    };
    const handleOutlookCalendar = () => {
        const url = getOutlookCalendarUrl(game);
        if (url) window.open(url, '_blank');
        setShowCalendarPicker(false);
    };
    const handleAppleCalendar = () => {
        downloadGameCalendar(game);
        setShowCalendarPicker(false);
    };

    const getMissingRoles = () => {
        return game.roles
            .filter(r => !isRoleComplete(r))
            .map(r => r.name);
    };

    if (isEditing) {
        return (
            <Suspense fallback={<div className="p-8 bg-white rounded-2xl shadow-sm animate-pulse"><div className="h-64 bg-slate-100 rounded-xl"></div></div>}>
                <GameForm gameToEdit={game} onSave={(data) => onUpdateRequest(data as Game)} onCancel={onCancelEdit} />
            </Suspense>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`
            relative rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all duration-300
            bg-white dark:bg-slate-900
            ${isFullyStaffed ? 'ring-2 ring-emerald-400 dark:ring-emerald-600 ring-inset' : 'border border-slate-200 dark:border-slate-700'}
            ${isUrgent && !isFullyStaffed ? 'animate-pulse-red ring-2 ring-red-400 border-red-400 ring-inset' : ''}
        `}>
            {/* Header */}
            <div className={`relative p-4 overflow-hidden ${isHomeGame
                ? 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-green-50 dark:from-emerald-900/50 dark:via-emerald-900/30 dark:to-slate-900'
                : 'bg-gradient-to-br from-blue-100 via-blue-50 to-sky-50 dark:from-blue-900/50 dark:via-blue-900/30 dark:to-slate-900'
                }`}>

                {/* Watermark Icon */}
                <div className={`absolute -right-4 -top-4 text-8xl opacity-10 dark:opacity-5 select-none pointer-events-none`}>
                    {isHomeGame ? '🏟️' : '🚌'}
                </div>

                {/* Top Row */}
                <div className="relative flex items-start justify-between gap-2 mb-1 z-10">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight font-sport tracking-wide">{game.team}</h3>
                    <div className="flex flex-wrap gap-1.5 items-center flex-shrink-0">
                        <span className={`
                            px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm
                            ${isHomeGame
                                ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                                : 'bg-blue-500 text-white dark:bg-blue-600'
                            }
                        `}>
                            {isHomeGame ? '🏠 Domicile' : '🚗 Extérieur'}
                        </span>

                        {!isHomeGame && totalCarpoolSeats > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-emerald-50 text-emerald-700">
                                🚗 {totalCarpoolSeats}
                            </span>
                        )}

                        {isFullyStaffed && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-emerald-100 text-emerald-800">
                                ✓ Complet
                            </span>
                        )}

                        {isUrgent && !isFullyStaffed && (
                            <motion.span
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-red-100 text-red-600 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800"
                            >
                                🔥 Urgence
                            </motion.span>
                        )}
                    </div>
                </div>

                {/* Opponent */}
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 font-sport tracking-wide">
                    vs <span className="text-red-600 dark:text-red-400">{game.opponent}</span>
                </p>

                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md backdrop-blur-sm">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{game.date}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md backdrop-blur-sm">
                            <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{game.time}</span>
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <LocationIcon className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                            <a
                                href={`https://waze.com/ul?q=${encodeURIComponent(game.location)}&navigate=yes`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                                {game.location}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Admin Controls */}
                {isAdmin && (
                    <div className="flex gap-2 mt-3 pt-2 border-t border-slate-200/50 w-full justify-end">
                        <button onClick={onEditRequest} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><EditIcon className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><DeleteIcon className="w-4 h-4" /></button>
                        <ConfirmModal
                            isOpen={showDeleteConfirm}
                            title="Supprimer ce match ?"
                            message={`Voulez-vous vraiment supprimer le match ?`}
                            confirmText="Supprimer"
                            cancelText="Annuler"
                            confirmStyle="danger"
                            onConfirm={() => { setShowDeleteConfirm(false); onDeleteRequest(); }}
                            onCancel={() => setShowDeleteConfirm(false)}
                        />
                    </div>
                )}
            </div>

            {/* Accordion Trigger */}
            <motion.button
                whileTap={{ backgroundColor: "rgba(241, 245, 249, 1)" }}
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    w-full px-4 py-3 flex items-center justify-between cursor-pointer
                    bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700
                    transition-colors relative overflow-hidden
                `}
            >
                {/* Progress Bar Background */}
                {!isFullyStaffed && isHomeGame && (
                    <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/5 z-0 transition-all duration-500"
                        style={{ width: `${(totalVolunteers / totalCapacity) * 100}%` }}
                    ></div>
                )}

                <div className="flex items-center gap-3 relative z-10">
                    {isHomeGame && (
                        <span className={`text-sm font-medium ${isFullyStaffed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {isFullyStaffed ? (
                                <>🎉 Équipe complète !</>
                            ) : (
                                <>
                                    <span className="font-bold">{totalVolunteers}/{totalCapacity}</span> bénévoles
                                    {getMissingRoles().length > 0 && (
                                        <span className="text-slate-500 dark:text-slate-400 ml-1.5 hidden sm:inline">
                                            • Manque : <span className="text-red-600 dark:text-red-400 font-medium">{getMissingRoles().join(', ')}</span>
                                        </span>
                                    )}
                                </>
                            )}
                        </span>
                    )}
                    {!isHomeGame && (
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {(() => {
                                const drivers = game.carpool?.filter(e => e.type === 'driver').length || 0;
                                return drivers > 0 ? `🚗 ${drivers} conducteur${drivers > 1 ? 's' : ''}` : '🚗 0 inscription';
                            })()}
                        </span>
                    )}
                </div>
                <ChevronIcon className="w-5 h-5 text-slate-400 relative z-10" isOpen={isExpanded} />
            </motion.button>

            {/* Expandable Content with AnimatePresence */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="overflow-hidden bg-white dark:bg-slate-900"
                    >
                        <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                            {/* Actions Row */}
                            <div ref={calendarPickerRef} className="relative mb-4 flex gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowCalendarPicker(!showCalendarPicker)}
                                    className="flex-1 py-2.5 px-4 flex items-center justify-center gap-2
                                        text-xs sm:text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl
                                        hover:bg-indigo-100 transition-colors"
                                >
                                    <span>📅</span>
                                    <span>Calendrier</span>
                                </motion.button>

                                {!isHomeGame && (
                                    <motion.a
                                        whileTap={{ scale: 0.98 }}
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(game.location)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-2.5 px-4 flex items-center justify-center gap-2
                                        text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 rounded-xl
                                        hover:bg-blue-100 transition-colors"
                                    >
                                        <span>🗺️</span>
                                        <span>Trajet</span>
                                    </motion.a>
                                )}

                                {/* Calendar Dropdown */}
                                {showCalendarPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                                    >
                                        <button onClick={handleGoogleCalendar} className="w-full px-4 py-3 flex gap-3 hover:bg-slate-50 text-sm font-medium text-slate-700 items-center">
                                            <GoogleCalendarIcon className="w-5 h-5" /> Google
                                        </button>
                                        <button onClick={handleOutlookCalendar} className="w-full px-4 py-3 flex gap-3 hover:bg-slate-50 text-sm font-medium text-slate-700 border-t border-slate-50 items-center">
                                            <OutlookCalendarIcon className="w-5 h-5" /> Outlook
                                        </button>
                                        <button onClick={handleAppleCalendar} className="w-full px-4 py-3 flex gap-3 hover:bg-slate-50 text-sm font-medium text-slate-700 border-t border-slate-50 items-center">
                                            <AppleCalendarIcon className="w-5 h-5" /> Apple (.ics)
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            {/* Volunteer Slots */}
                            {isHomeGame && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Postes à pourvoir</h4>
                                    <div className="space-y-2">
                                        {game.roles.map((role, index) => (
                                            <VolunteerSlot
                                                key={role.id}
                                                role={role}
                                                gameId={game.id}
                                                isAdmin={isAdmin}
                                                myRegistrationName={userRegistrations?.get(`${game.id}_${role.id}`)}
                                                isAuthenticated={isAuthenticated}
                                                onVolunteer={(parentName) => onVolunteer(game.id, role.id, parentName)}
                                                onRemoveVolunteer={(volunteerName) => onRemoveVolunteer(game.id, role.id, volunteerName)}
                                                onUpdateVolunteer={(oldName, newName) => onUpdateVolunteer(game.id, role.id, oldName, newName)}
                                                animationDelay={index * 0.05}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Carpooling */}
                            {!isHomeGame && (
                                <CarpoolingSection
                                    gameId={game.id}
                                    entries={game.carpool || []}
                                    isAdmin={isAdmin}
                                    onAddEntry={(entry) => onAddCarpool(game.id, entry)}
                                    onRemoveEntry={(entryId) => onRemoveCarpool(game.id, entryId)}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

GameCard.displayName = 'GameCard';

export default GameCard;