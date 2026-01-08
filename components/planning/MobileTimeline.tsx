import React from 'react';
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
    onToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onEditRequest: (gameId: string) => void;
    onCancelEdit: () => void;
    onDeleteRequest: (gameId: string) => void;
    onUpdateRequest: (game: Game) => void;
    userRegistrations?: Map<string, string>;
    isAuthenticated?: boolean;
}

const MobileTimeline: React.FC<MobileTimelineProps> = ({
    games,
    currentDate,
    isAdmin,
    editingGameId,
    onVolunteer,
    onRemoveVolunteer,
    onUpdateVolunteer,
    onAddCarpool,
    onRemoveCarpool,
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

    // Helper to format ISO date YYYY-MM-DD for comparison
    const toISODate = (date: Date) => {
        return date.toISOString().split('T')[0];
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
        <div className="lg:hidden flex flex-col gap-6 ">
            {activeDays.length > 0 ? (
                activeDays.map((day, dayIdx) => {
                    const dayGames = getGamesForDay(day);
                    const isToday = toISODate(day) === toISODate(new Date());

                    return (
                        <div key={day.toISOString()} className="relative pl-6 animate-fade-in-up" style={{ animationDelay: `${dayIdx * 100}ms` }}>

                            {/* Timeline Line (Modernized) */}
                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-slate-700 via-slate-800 to-transparent">
                                <div className={`absolute top-2 -left-[5px] w-3 h-3 rounded-full border-2 transition-all duration-500 ${isToday ? 'bg-blue-500 border-blue-900 shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-110' : 'bg-slate-900 border-slate-600'}`} />
                            </div>

                            {/* Date Header */}
                            <div className="mb-4 flex items-baseline gap-3">
                                <span className={`text-lg font-black uppercase tracking-tight ${isToday ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400' : 'text-slate-200'}`}>
                                    {day.toLocaleDateString('fr-FR', { weekday: 'long' })}
                                </span>
                                <span className="text-sm font-medium text-slate-500">
                                    {day.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                </span>
                            </div>

                            {/* Games using FULL GameCard */}
                            <div className="flex flex-col gap-4">
                                {dayGames.map(game => (
                                    <GameCard
                                        key={game.id}
                                        game={game}
                                        isAdmin={isAdmin}
                                        isEditing={editingGameId === game.id}
                                        onVolunteer={onVolunteer}
                                        onRemoveVolunteer={onRemoveVolunteer}
                                        onUpdateVolunteer={onUpdateVolunteer}
                                        onAddCarpool={onAddCarpool}
                                        onRemoveCarpool={onRemoveCarpool}
                                        onToast={onToast}
                                        onEditRequest={() => onEditRequest(game.id)}
                                        onCancelEdit={onCancelEdit}
                                        onDeleteRequest={() => onDeleteRequest(game.id)}
                                        onUpdateRequest={onUpdateRequest}
                                        userRegistrations={userRegistrations}
                                        isAuthenticated={isAuthenticated}
                                    />
                                ))}
                            </div>

                        </div>
                    );
                })
            ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
                    <span className="text-4xl mb-2">💤</span>
                    <p className="text-slate-500 text-sm">Pas de matchs cette semaine</p>
                </div>
            )}
        </div>
    );
};

export default MobileTimeline;
