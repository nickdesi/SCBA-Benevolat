import React, { memo, useMemo } from 'react';
import type { Game, CarpoolEntry } from '../../types';
import GameCard from '../GameCard';
import { toISODateString, getDaysOfWeek } from '../../utils/dateUtils';

interface DesktopGridProps {
    games: Game[];
    currentDate: Date;
    isAdmin: boolean;
    editingGameId: string | null;
    onVolunteer: (gameId: string, roleId: string, parentName: string | string[]) => void;
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
    userRegistrations?: Map<string, string[]>;
    isAuthenticated?: boolean;
}

const DesktopGrid: React.FC<DesktopGridProps> = memo(({
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
    // Memoized week calculation
    const days = useMemo(() => getDaysOfWeek(currentDate),
        [currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()]
    );

    // Pre-compute games grouped by day to avoid double filtering
    const gamesByDay = useMemo(() => {
        const map = new Map<string, Game[]>();
        for (const game of games) {
            const existing = map.get(game.dateISO) || [];
            existing.push(game);
            map.set(game.dateISO, existing);
        }
        // Sort each day's games by time
        for (const [key, dayGames] of map) {
            map.set(key, dayGames.sort((a, b) => a.time.localeCompare(b.time)));
        }
        return map;
    }, [games]);

    // Filter out days with no games using pre-computed map
    const activeDays = useMemo(() =>
        days.filter(day => (gamesByDay.get(toISODateString(day))?.length ?? 0) > 0),
        [days, gamesByDay]
    );

    return (
        <div className="hidden lg:block relative min-h-[600px] border-t border-slate-800/50 pt-6">
            {activeDays.length > 0 ? (
                <div className="flex justify-center gap-6 overflow-x-auto p-6 custom-scrollbar">
                    {activeDays.map((day) => {
                        const dayGames = gamesByDay.get(toISODateString(day)) || [];
                        const isToday = toISODateString(day) === toISODateString(new Date());

                        return (
                            <div
                                key={day.toISOString()}
                                className="flex flex-col gap-4 flex-1 min-w-[380px] max-w-[500px]"
                            >

                                {/* Column Header — Modern horizontal glassmorphism */}
                                <div className={`
                                    relative flex items-center justify-between px-5 py-3.5 rounded-2xl border mb-2
                                    transition-all duration-300 overflow-hidden
                                    ${isToday
                                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40 shadow-[0_0_24px_rgba(59,130,246,0.1)] dark:shadow-[0_0_24px_rgba(59,130,246,0.15)]'
                                        : 'bg-white dark:bg-slate-800/60 backdrop-blur-md border-slate-200 dark:border-slate-700/60'
                                    }
                                `}>
                                    {/* Subtle gradient shimmer for today */}
                                    {isToday && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/8 to-blue-500/5 pointer-events-none" />
                                    )}

                                    {/* Left: Date info */}
                                    <div className="relative flex items-center gap-3">
                                        <div className={`text-3xl font-black leading-none ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                                            {day.getDate()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold uppercase tracking-wider leading-tight ${isToday ? 'text-blue-600 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {day.toLocaleDateString('fr-FR', { weekday: 'long' })}
                                            </span>
                                            <span className={`text-[10px] font-medium uppercase tracking-wide ${isToday ? 'text-blue-500/70 dark:text-blue-400/70' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {day.toLocaleDateString('fr-FR', { month: 'long' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right: Stats */}
                                    <div className="relative flex items-center gap-2">
                                        <div className={`text-sm font-bold px-3 py-1 rounded-lg ${isToday ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'}`}>
                                            {dayGames.length} match{dayGames.length > 1 ? 's' : ''}
                                        </div>
                                        <div className="flex gap-1">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                                {dayGames.filter((g: Game) => (g.isHome ?? true)).length}D
                                            </span>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                                {dayGames.filter((g: Game) => !(g.isHome ?? true)).length}E
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Games List - Using FULL GameCard */}
                                <div className="flex flex-col gap-4">
                                    {dayGames.map((game: Game) => (
                                        <div
                                            key={game.id}
                                            className=""
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
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="h-[400px] rounded-3xl border border-dashed border-slate-800/50 bg-slate-900/10 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                    <div className="w-20 h-20 bg-slate-800/30 rounded-full flex items-center justify-center mb-4 text-4xl grayscale opacity-50">
                        😴
                    </div>
                    <h3 className="text-xl font-bold text-slate-300 mb-2">Aucun match cette semaine</h3>
                    <p className="text-slate-500 max-w-sm">
                        Profitez-en pour vous reposer ou préparer la semaine prochaine !
                    </p>
                </div>
            )}
        </div>
    );
});

DesktopGrid.displayName = 'DesktopGrid';

export default DesktopGrid;
