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
                        <div key={day.toISOString()} className="relative animate-fade-in-up" style={{ animationDelay: `${dayIdx * 100}ms` }}>

                            {/* Date Header - Pill Style with Stats */}
                            <div className="mb-4">
                                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-700 rounded-full shadow-lg shadow-slate-900/20 z-10 relative">
                                    <span className="text-2xl">📅</span>
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className="text-lg font-black text-white tracking-wide capitalize">
                                            {day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </span>
                                        <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">
                                            {dayGames.filter(g => (g.isHome ?? true)).length} Dom • {dayGames.filter(g => !(g.isHome ?? true)).length} Ext
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold px-2.5 py-0.5 bg-white/20 text-white/90 rounded-full ml-2">
                                        {dayGames.length} matchs
                                    </span>
                                </div>
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
