import React, { memo, useRef, useEffect, Suspense, lazy, useState } from 'react';
import type { Game, CarpoolEntry } from '../types';
import VolunteerSlot from './VolunteerSlot';
import CarpoolingSection from './CarpoolingSection';
import { CalendarIcon, ClockIcon, LocationIcon, EditIcon, DeleteIcon, GoogleCalendarIcon, OutlookCalendarIcon, AppleCalendarIcon } from './Icons';
import { downloadGameCalendar, getGoogleCalendarUrl, getOutlookCalendarUrl } from '../utils/calendar';

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
    <svg
        className={`${className} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
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
    // Accordion state
    const [isExpanded, setIsExpanded] = useState(false);

    if (isEditing) {
        return (
            <Suspense fallback={<div className="p-8 bg-white rounded-2xl shadow-sm animate-pulse"><div className="h-64 bg-slate-100 rounded-xl"></div></div>}>
                <GameForm gameToEdit={game} onSave={(data) => onUpdateRequest(data as Game)} onCancel={onCancelEdit} />
            </Suspense>
        );
    }

    const isFullyStaffed = isGameFullyStaffed(game);
    const totalVolunteers = game.roles.reduce((sum, r) => sum + r.volunteers.length, 0);
    const totalCapacity = game.roles.reduce((sum, r) => {
        const isUnlimited = r.capacity === Infinity || r.capacity === 0;
        return sum + (isUnlimited ? 2 : r.capacity); // Target 2 for unlimited
    }, 0);

    // Calculate total carpool seats available
    const totalCarpoolSeats = React.useMemo(() => {
        if (!game.carpool) return 0;
        return game.carpool
            .filter(e => e.type === 'driver')
            .reduce((sum, driver) => sum + (driver.seats || 0), 0);
    }, [game.carpool]);

    // Default to home game if isHome is not defined (legacy matches)
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

    const handleGoogleCalendar = () => {
        const url = getGoogleCalendarUrl(game);
        if (url) {
            window.open(url, '_blank');
            if (onToast) onToast('📅 Ouverture de Google Calendar...', 'success');
        } else if (onToast) {
            onToast('Erreur lors de la création du lien calendrier', 'error');
        }
        setShowCalendarPicker(false);
    };

    const handleOutlookCalendar = () => {
        const url = getOutlookCalendarUrl(game);
        if (url) {
            window.open(url, '_blank');
            if (onToast) onToast('📅 Ouverture de Outlook...', 'success');
        } else if (onToast) {
            onToast('Erreur lors de la création du lien calendrier', 'error');
        }
        setShowCalendarPicker(false);
    };

    const handleAppleCalendar = () => {
        const success = downloadGameCalendar(game);
        if (success && onToast) {
            onToast('📅 Fichier ICS téléchargé (ouvrez-le pour l\'ajouter)', 'success');
        } else if (!success && onToast) {
            onToast('Erreur lors de la création du fichier calendrier', 'error');
        }
        setShowCalendarPicker(false);
    };

    // Determine left border color
    const getBorderColor = () => {
        if (isFullyStaffed) return 'border-l-emerald-500';
        if (isHomeGame) return 'border-l-green-500';
        return 'border-l-blue-500';
    };

    // Summary text for collapsed state
    const getMissingRoles = () => {
        return game.roles
            .filter(r => !isRoleComplete(r))
            .map(r => r.name);
    };

    return (
        <div className={`
            relative rounded-2xl shadow-sm hover:shadow-md
            transition-all duration-300 h-full flex flex-col overflow-hidden
            ${isFullyStaffed ? 'ring-2 ring-emerald-400 dark:ring-emerald-600' : 'border border-slate-200 dark:border-slate-700'}
            bg-white dark:bg-slate-900
        `}>
            {/* Header with STRONG color distinction */}
            <div className={`relative p-4 overflow-hidden ${isHomeGame
                    ? 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-green-50 dark:from-emerald-900/50 dark:via-emerald-900/30 dark:to-slate-900'
                    : 'bg-gradient-to-br from-blue-100 via-blue-50 to-sky-50 dark:from-blue-900/50 dark:via-blue-900/30 dark:to-slate-900'
                }`}>
                {/* Watermark Icon */}
                <div className={`absolute -right-4 -top-4 text-8xl opacity-10 dark:opacity-5 select-none pointer-events-none`}>
                    {isHomeGame ? '🏟️' : '🚌'}
                </div>

                {/* Top Row: Team + Badges */}
                <div className="relative flex items-start justify-between gap-2 mb-1 z-10">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">{game.team}</h3>
                    <div className="flex flex-wrap gap-1.5 items-center flex-shrink-0">
                        {/* Home/Away Pill */}
                        <span className={`
                            px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-full shadow-sm
                            ${isHomeGame
                                ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                                : 'bg-blue-500 text-white dark:bg-blue-600'
                            }
                        `}>
                            {isHomeGame ? '🏠 Domicile' : '🚗 Extérieur'}
                        </span>

                        {/* Carpool Availability Badge */}
                        {!isHomeGame && totalCarpoolSeats > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-emerald-50 text-emerald-700">
                                🚗 {totalCarpoolSeats}
                            </span>
                        )}

                        {/* Status Badge */}
                        {isFullyStaffed && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-emerald-100 text-emerald-800">
                                ✓ Complet
                            </span>
                        )}
                    </div>
                </div>

                {/* Opponent */}
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                    vs <span className="text-red-600 dark:text-red-400">{game.opponent}</span>
                </p>

                {/* Meta Info: Date • Time • Location on one line */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {game.date}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {game.time}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 truncate max-w-[150px]" title={game.location}>
                        <LocationIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{game.location}</span>
                    </span>
                </div>

                {/* Admin Controls */}
                {isAdmin && (
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={onEditRequest}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                                     text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            aria-label="Modifier le match"
                        >
                            <EditIcon className="w-3 h-3" />
                            Modifier
                        </button>
                        <button
                            onClick={onDeleteRequest}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                                     text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            aria-label="Supprimer le match"
                        >
                            <DeleteIcon className="w-3 h-3" />
                            Supprimer
                        </button>
                    </div>
                )}
            </div>

            {/* Accordion Trigger: Summary Bar */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    w-full px-4 py-3 flex items-center justify-between cursor-pointer
                    bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800
                    border-t border-slate-100 dark:border-slate-700
                    transition-colors
                    ${isExpanded ? '' : 'rounded-b-2xl'}
                `}
            >
                <div className="flex items-center gap-3">
                    {/* Volunteer Summary */}
                    {isHomeGame && (
                        <span className={`text-sm font-medium ${isFullyStaffed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {isFullyStaffed ? (
                                <>🎉 Équipe complète !</>
                            ) : (
                                <>
                                    <span className="font-bold">{totalVolunteers}/{totalCapacity}</span> bénévoles
                                    {getMissingRoles().length > 0 && (
                                        <span className="text-slate-500 dark:text-slate-400 ml-1.5">
                                            • Manque : <span className="text-red-600 dark:text-red-400 font-medium">{getMissingRoles().join(', ')}</span>
                                        </span>
                                    )}
                                </>
                            )}
                        </span>
                    )}
                    {/* Carpool Summary for Away games */}
                    {!isHomeGame && (
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            🚗 {(game.carpool?.length || 0)} inscription{(game.carpool?.length || 0) > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <ChevronIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" isOpen={isExpanded} />
            </button>

            {/* Expandable Content */}
            <div className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
            `}>
                <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-2xl">
                    {/* Add to Calendar Picker */}
                    <div ref={calendarPickerRef} className="relative mb-4">
                        <button
                            onClick={() => setShowCalendarPicker(!showCalendarPicker)}
                            className="w-full py-2.5 px-4 flex items-center justify-center gap-2
                                text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl
                                hover:bg-indigo-100 transition-colors"
                        >
                            <span>📅</span>
                            <span>Ajouter au calendrier</span>
                            <span className={`transition-transform duration-200 text-xs ${showCalendarPicker ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        {/* Dropdown Menu */}
                        {showCalendarPicker && (
                            <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-fade-in">
                                <button
                                    onClick={handleGoogleCalendar}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                                >
                                    <GoogleCalendarIcon className="w-6 h-6" />
                                    <div>
                                        <p className="font-medium text-slate-800 text-sm">Google Calendar</p>
                                    </div>
                                </button>
                                <button
                                    onClick={handleOutlookCalendar}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left border-t border-slate-50"
                                >
                                    <OutlookCalendarIcon className="w-6 h-6" />
                                    <div>
                                        <p className="font-medium text-slate-800 text-sm">Outlook</p>
                                    </div>
                                </button>
                                <button
                                    onClick={handleAppleCalendar}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left border-t border-slate-50"
                                >
                                    <AppleCalendarIcon className="w-6 h-6" />
                                    <div>
                                        <p className="font-medium text-slate-800 text-sm">Apple / Autre (.ics)</p>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Volunteer Section - Only for HOME games */}
                    {isHomeGame && (
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                Postes à pourvoir
                            </h4>
                            <div className="space-y-2">
                                {game.roles.map((role, index) => (
                                    <VolunteerSlot
                                        key={role.id}
                                        role={role}
                                        gameId={game.id}
                                        isAdmin={isAdmin}
                                        myRegistrationName={userRegistrations?.get(`${game.id}_${role.id}`)}
                                        isAuthenticated={isAuthenticated}
                                        onVolunteer={(parentName) => {
                                            onVolunteer(game.id, role.id, parentName);
                                        }}
                                        onRemoveVolunteer={(volunteerName) => onRemoveVolunteer(game.id, role.id, volunteerName)}
                                        onUpdateVolunteer={(oldName, newName) => onUpdateVolunteer(game.id, role.id, oldName, newName)}
                                        animationDelay={index * 0.05}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Carpooling Section - Only for AWAY games */}
                    {!isHomeGame && (
                        <CarpoolingSection
                            gameId={game.id}
                            entries={game.carpool || []}
                            isAdmin={isAdmin}
                            onAddEntry={(entry) => {
                                onAddCarpool(game.id, entry);
                                if (onToast) onToast('🚗 Inscription covoiturage confirmée !', 'success');
                            }}
                            onRemoveEntry={(entryId) => onRemoveCarpool(game.id, entryId)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
});

GameCard.displayName = 'GameCard';

export default GameCard;