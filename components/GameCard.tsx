import React, { memo, useState, Suspense, lazy, useMemo } from 'react';
import type { Game, CarpoolEntry } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import GameHeader from './GameCard/GameHeader';
import VolunteerSection from './GameCard/VolunteerSection';
import ActionButtons from './GameCard/ActionButtons';
import CarpoolingSection from './GameCard/CarpoolingSection';

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
    // Accordion state - Default expanded if urgent logic removed or kept? kept locally but simplified
    const [isExpanded, setIsExpanded] = useState(false);

    const isFullyStaffed = isGameFullyStaffed(game);
    const totalVolunteers = game.roles.reduce((sum, r) => sum + r.volunteers.length, 0);

    // Calculate "effective" filled slots (clamped to capacity) to avoid "7/6" situations
    const filledSlots = game.roles.reduce((sum, r) => {
        const isUnlimited = r.capacity === Infinity || r.capacity === 0;
        const capacity = isUnlimited ? 2 : r.capacity;
        return sum + Math.min(r.volunteers.length, capacity);
    }, 0);

    const totalCapacity = game.roles.reduce((sum, r) => {
        const isUnlimited = r.capacity === Infinity || r.capacity === 0;
        return sum + (isUnlimited ? 2 : r.capacity); // Target 2 for unlimited
    }, 0);

    const totalCarpoolSeats = useMemo(() => {
        if (!game.carpool) return 0;
        return game.carpool
            .filter(e => e.type === 'driver')
            .reduce((sum, driver) => sum + (driver.seats || 0), 0);
    }, [game.carpool]);

    const totalPassengerRequests = useMemo(() => {
        if (!game.carpool) return 0;
        return game.carpool.filter(e => e.type === 'passenger').length;
    }, [game.carpool]);

    const isHomeGame = game.isHome ?? true;

    const isUrgent = useMemo(() => {
        if (!isHomeGame) return false;
        if (isFullyStaffed) return false;
        try {
            const gameDate = new Date(game.dateISO);
            const now = new Date();
            const diffMs = gameDate.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            return diffHours > 0 && diffHours < 48;
        } catch {
            return false;
        }
    }, [game.dateISO, isFullyStaffed, isHomeGame]);

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
            relative rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all duration-150
            bg-white dark:bg-slate-900
        `}>
            {/* Border/Ring Overlay - Always on top */}
            <div className={`
                absolute inset-0 pointer-events-none z-50 rounded-2xl
                ${isFullyStaffed
                    ? 'ring-2 ring-emerald-400 dark:ring-emerald-600 ring-inset'
                    : 'ring-1 ring-slate-200 dark:ring-slate-700 ring-inset'
                }
                ${isUrgent && !isFullyStaffed ? 'animate-pulse-red ring-2 ring-red-400 dark:ring-red-400' : ''}
            `} />
            {/* 1. Header Section */}
            <GameHeader
                game={game}
                isHomeGame={isHomeGame}
                isFullyStaffed={isFullyStaffed}
                totalCarpoolSeats={totalCarpoolSeats}
                totalPassengerRequests={totalPassengerRequests}
                isUrgent={isUrgent}
                isAdmin={isAdmin}
                onEditRequest={onEditRequest}
                onDeleteRequest={onDeleteRequest}
            />

            {/* 2. Accordion Trigger */}
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
                    <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/5 z-0 transition-all duration-200"
                        style={{ width: `${(filledSlots / totalCapacity) * 100}%` }}
                    ></div>
                )}

                <div className="flex items-center gap-3 relative z-10">
                    {isHomeGame && (
                        <span className={`text-sm font-medium ${isFullyStaffed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {isFullyStaffed ? (
                                <>🎉 Équipe complète !</>
                            ) : (
                                <>
                                    <span className="font-bold">{filledSlots}/{totalCapacity}</span> bénévoles
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
                                const passengers = game.carpool?.filter(e => e.type === 'passenger').length || 0;

                                if (drivers === 0 && passengers === 0) return '🚗 0 inscription';

                                const parts = [];
                                if (drivers > 0) parts.push(`${drivers} cond.`);
                                if (passengers > 0) parts.push(`${passengers} pass.`);

                                return `🚗 ${parts.join(' • ')}`;
                            })()}
                        </span>
                    )}
                </div>
                <ChevronIcon className="w-5 h-5 text-slate-400 relative z-10" isOpen={isExpanded} />
            </motion.button>

            {/* 3. Dropdown Content */}
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

                            {/* Actions (Calendrier, Trajet) */}
                            <ActionButtons
                                game={game}
                                isHomeGame={isHomeGame}
                            />

                            {/* Volunteer Slots */}
                            {isHomeGame && (
                                <VolunteerSection
                                    roles={game.roles}
                                    gameId={game.id}
                                    isAdmin={isAdmin}
                                    userRegistrations={userRegistrations}
                                    isAuthenticated={isAuthenticated}
                                    onVolunteer={onVolunteer}
                                    onRemoveVolunteer={onRemoveVolunteer}
                                    onUpdateVolunteer={onUpdateVolunteer}
                                />
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