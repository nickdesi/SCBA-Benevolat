import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Game, CarpoolEntry } from '../../types';
import GameCard from '../GameCard';

interface MobileTimelineProps {
    games: Game[];
    currentDate: Date;
    isAdmin: boolean;
    editingGameId: string | null;
    onVolunteer: (gameId: string, roleId: string, parentName: string) => void;
    onRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => void;
    onUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => void;
    onAddCarpool: (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => void;
    onRemoveCarpool: (gameId: string, entryId: string) => void;
    onRequestSeat?: (gameId: string, passengerId: string, driverId: string) => void;
    onAcceptPassenger?: (gameId: string, driverId: string, passengerId: string) => void;
    onRejectPassenger?: (gameId: string, driverId: string, passengerId: string) => void;
    onCancelRequest?: (gameId: string, passengerId: string) => void;
    onToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onEditRequest: (gameId: string) => void;
    onCancelEdit: () => void;
    onDeleteRequest: (gameId: string) => void;
    onUpdateRequest: (game: Game) => void;
    userRegistrations?: Map<string, string>;
    isAuthenticated?: boolean;
}

// Animation variants for staggered entrance
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const dayVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 24
        }
    }
};

const gameVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring' as const,
            stiffness: 400,
            damping: 25
        }
    }
};

const emptyVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 0.6,
        scale: 1,
        transition: { duration: 0.4 }
    }
};

const MobileTimeline: React.FC<MobileTimelineProps> = memo(({
    games,
    currentDate,
    isAdmin,
    editingGameId,
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
    onEditRequest,
    onCancelEdit,
    onDeleteRequest,
    onUpdateRequest,
    userRegistrations,
    isAuthenticated,
}) => {
    // Helpers
    const getDaysOfWeek = (date: Date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start.setDate(diff);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const days = getDaysOfWeek(currentDate);

    // Helper to format local date YYYY-MM-DD for comparison (avoiding UTC conversion issues)
    const toISODate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getGamesForDay = (date: Date) => {
        const dateStr = toISODate(date);
        return games
            .filter(g => g.dateISO === dateStr)
            .sort((a, b) => a.time.localeCompare(b.time));
    };

    // Filter out days with no games
    const activeDays = days.filter(day => getGamesForDay(day).length > 0);

    return (
        <motion.div
            className="lg:hidden flex flex-col gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <AnimatePresence mode="popLayout">
                {activeDays.length > 0 ? (
                    activeDays.map((day, dayIdx) => {
                        const dayGames = getGamesForDay(day);
                        const isToday = toISODate(day) === toISODate(new Date());

                        return (
                            <motion.div
                                key={day.toISOString()}
                                className="relative"
                                variants={dayVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                layout
                            >
                                {/* Date Header - Pill Style with Stats */}
                                <motion.div
                                    className="mb-4"
                                    variants={dayVariants} // Use same variants to sync opacity
                                >
                                    <div className={`
                                        inline-flex items-center gap-3 px-6 py-3 rounded-full shadow-lg z-10 relative
                                        ${isToday
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30'
                                            : 'bg-gradient-to-r from-slate-800 to-slate-700 shadow-slate-900/20'}
                                    `}>
                                        <span className="text-2xl">{isToday ? '🔥' : '📅'}</span>
                                        <div className="flex flex-col items-start leading-tight">
                                            <span className="text-lg font-black text-white tracking-wide capitalize whitespace-nowrap">
                                                {isToday ? "Aujourd'hui" : day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </span>
                                            <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">
                                                {dayGames.filter(g => (g.isHome ?? true)).length} Dom • {dayGames.filter(g => !(g.isHome ?? true)).length} Ext
                                            </span>
                                        </div>
                                        <span className="self-center flex flex-col items-center text-center font-bold px-3 py-1.5 bg-white/20 text-white/90 rounded-xl ml-2">
                                            <span className="text-base leading-tight">{dayGames.length}</span>
                                            <span className="text-[10px] leading-tight">matchs</span>
                                        </span>
                                    </div>
                                </motion.div>

                                {/* Games using FULL GameCard with stagger */}
                                <motion.div
                                    className="flex flex-col gap-4"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {dayGames.map((game, gameIdx) => (
                                        <motion.div
                                            key={game.id}
                                            variants={gameVariants}
                                            layout
                                        >
                                            <GameCard
                                                game={game}
                                                isAdmin={isAdmin}
                                                isEditing={editingGameId === game.id}
                                                onVolunteer={onVolunteer}
                                                onRemoveVolunteer={onRemoveVolunteer}
                                                onUpdateVolunteer={onUpdateVolunteer}
                                                onAddCarpool={onAddCarpool}
                                                onRemoveCarpool={onRemoveCarpool}
                                                onRequestSeat={onRequestSeat}
                                                onAcceptPassenger={onAcceptPassenger}
                                                onRejectPassenger={onRejectPassenger}
                                                onCancelRequest={onCancelRequest}
                                                onToast={onToast}
                                                onEditRequest={() => onEditRequest(game.id)}
                                                onCancelEdit={onCancelEdit}
                                                onDeleteRequest={() => onDeleteRequest(game.id)}
                                                onUpdateRequest={onUpdateRequest}
                                                userRegistrations={userRegistrations}
                                                isAuthenticated={isAuthenticated}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>

                            </motion.div>
                        );
                    })
                ) : (
                    <motion.div
                        className="py-12 flex flex-col items-center justify-center text-center"
                        variants={emptyVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <span className="text-4xl mb-2">💤</span>
                        <p className="text-slate-500 text-sm">Pas de matchs cette semaine</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div >
    );
});

MobileTimeline.displayName = 'MobileTimeline';


export default MobileTimeline;
