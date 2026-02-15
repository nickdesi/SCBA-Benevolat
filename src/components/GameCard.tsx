import React, { memo, useState, Suspense, lazy, useMemo } from 'react';
import { Car, CheckIcon } from 'lucide-react';
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
    onVolunteer: (gameId: string, roleId: string, parentName: string | string[]) => void;
    onRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => void;
    onUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => void;
    onAddCarpool: (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => void;
    onRemoveCarpool: (gameId: string, entryId: string) => void;
    onRequestSeat?: (gameId: string, passengerId: string, driverId: string) => void;
    onAcceptPassenger?: (gameId: string, driverId: string, passengerId: string) => void;
    onRejectPassenger?: (gameId: string, driverId: string, passengerId: string) => void;
    onCancelRequest?: (gameId: string, passengerId: string) => void;
    onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
    isAdmin: boolean;
    isEditing: boolean;
    onEditRequest: () => void;
    onCancelEdit: () => void;
    onDeleteRequest: () => void;
    onUpdateRequest: (game: Game) => void;
    userRegistrations?: Map<string, string[]>;
    isAuthenticated?: boolean;
    index?: number;
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
    onRequestSeat,
    onAcceptPassenger,
    onRejectPassenger,
    onCancelRequest,
    onToast,
    isAdmin,
    isEditing,
    onEditRequest,
    onCancelEdit,
    onDeleteRequest,
    onUpdateRequest,
    userRegistrations,
    isAuthenticated,
    index = 0,
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

    const missingRoles = useMemo(() => {
        return game.roles
            .filter(r => !isRoleComplete(r))
            .map(r => r.name);
    }, [game.roles]);

    if (isEditing) {
        return (
            <Suspense fallback={<div className="p-8 bg-white rounded-2xl shadow-sm animate-pulse"><div className="h-64 bg-slate-100 rounded-xl"></div></div>}>
                <GameForm gameToEdit={game} onSave={(data) => onUpdateRequest(data as Game)} onCancel={onCancelEdit} />
            </Suspense>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94], delay: index * 0.05 }}
            className={`
            relative rounded-3xl overflow-hidden transition-all duration-300 h-full
            bg-white/90 dark:bg-slate-900/90 backdrop-blur-md
            border border-white/20 dark:border-slate-700/50
            ${isFullyStaffed 
                ? 'shadow-sm hover:shadow-md border-emerald-500/20 dark:border-emerald-500/20' 
                : isUrgent
                    ? 'shadow-lg hover:shadow-xl hover:-translate-y-1 border-red-500/30 dark:border-red-500/30 shadow-red-500/5'
                    : 'shadow-lg hover:shadow-xl hover:-translate-y-1'
            }
        `}>
            {/* 1. Header Section */}
            <div className="relative z-10">
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
            </div>

            {/* 2. Accordion Trigger */}
            <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    w-full px-4 py-3 flex items-center justify-between cursor-pointer
                    bg-slate-50/50 dark:bg-slate-900/30 
                    border-t border-slate-200/60 dark:border-slate-800/60
                    hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors relative group
                `}
            >
                {/* Progress Bar Background - Modern Gradient */}
                {isHomeGame && (
                    <div className={`absolute left-0 top-0 bottom-0 z-0 transition-all duration-1000 ease-out
                        ${isFullyStaffed
                            ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/20 to-emerald-500/30 dark:from-emerald-900/30 dark:to-emerald-900/50'
                            : 'bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-emerald-500/15 dark:from-emerald-900/10 dark:to-emerald-900/20 border-r border-emerald-500/10'
                        }`}
                        style={{ width: isFullyStaffed ? '100%' : `${(filledSlots / totalCapacity) * 100}%` }}
                    />
                )}

                {/* Status Content */}
                {isHomeGame && (
                    <div className="flex items-center gap-3 relative z-10 pl-1">
                        {isFullyStaffed ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="flex items-center gap-2 py-1 px-3 bg-emerald-100/80 dark:bg-emerald-900/60 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-sm backdrop-blur-sm"
                            >
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 20 }}
                                    className="p-0.5 rounded-full bg-emerald-500 text-white"
                                >
                                    <CheckIcon className="w-3 h-3" strokeWidth={3} />
                                </motion.span>
                                <span className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">Équipe au complet</span>
                            </motion.div>
                        ) : (
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <div className="flex items-baseline gap-1">
                                    <span className="font-black text-xl text-slate-800 dark:text-slate-100">{filledSlots}</span>
                                    <span className="text-slate-400 font-light text-lg">/</span>
                                    <span className="font-bold text-slate-500 dark:text-slate-400 text-lg">{totalCapacity}</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">Bénévoles</span>

                                {missingRoles.length > 0 && (
                                    <div className="hidden sm:inline-flex ml-2 items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 shadow-sm shadow-rose-100/50 dark:shadow-none">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-300 uppercase tracking-wide">
                                            Manque : {missingRoles[0]} {missingRoles.length > 1 ? `+${missingRoles.length - 1}` : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {!isHomeGame && (
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 relative z-10 pl-1">
                        {(() => {
                            const drivers = game.carpool?.filter(e => e.type === 'driver').length || 0;
                            const passengers = game.carpool?.filter(e => e.type === 'passenger').length || 0;

                            if (drivers === 0 && passengers === 0) return <span className="opacity-60">Aucun covoiturage</span>;

                            return (
                                <>
                                    {drivers > 0 && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-bold">{drivers} cond.</span>}
                                    {passengers > 0 && <span className="px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded text-xs font-bold">{passengers} pass.</span>}
                                </>
                            );
                        })()}
                    </span>
                )}

                <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                        ${isExpanded
                        ? 'bg-slate-200 dark:bg-slate-700 rotate-180'
                        : 'bg-white dark:bg-slate-800 shadow-sm group-hover:bg-slate-50'
                    }
                    `}>
                    <ChevronIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" isOpen={false} />
                </div>
            </motion.button>

            {/* 3. Dropdown Content */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="overflow-hidden relative z-20"
                    >
                        <div className="p-4 pt-2 border-t border-slate-200/50 dark:border-slate-800">

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
                                    teamName={game.team}
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
                                    onRequestSeat={onRequestSeat ? (passengerId, driverId) => onRequestSeat(game.id, passengerId, driverId) : undefined}
                                    onAcceptPassenger={onAcceptPassenger ? (driverId, passengerId) => onAcceptPassenger(game.id, driverId, passengerId) : undefined}
                                    onRejectPassenger={onRejectPassenger ? (driverId, passengerId) => onRejectPassenger(game.id, driverId, passengerId) : undefined}
                                    onCancelRequest={onCancelRequest ? (passengerId) => onCancelRequest(game.id, passengerId) : undefined}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div >
    );
});

GameCard.displayName = 'GameCard';

export default GameCard;