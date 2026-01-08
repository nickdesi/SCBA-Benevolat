import React from 'react';
import type { Game, CarpoolEntry } from '../../types';
import GameCard from '../GameCard';

interface DesktopGridProps {
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

const DesktopGrid: React.FC<DesktopGridProps> = ({
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
        <div className="hidden lg:block relative min-h-[600px] border-t border-slate-800/50 pt-6">
            {activeDays.length > 0 ? (
                <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                    {activeDays.map((day) => {
                        const dayGames = getGamesForDay(day);
                        const isToday = toISODate(day) === toISODate(new Date());

                        return (
                            <div
                                key={day.toISOString()}
                                className="flex flex-col gap-4 flex-1 min-w-[380px] max-w-[500px] animate-fade-in-up"
                            >

                                {/* Column Header - Matching GameCard dark style */}
                                <div className={`
                                    flex flex-col items-center justify-center py-4 rounded-xl border mb-2 transition-colors
                                    bg-slate-800 dark:bg-slate-800 border-slate-700
                                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                                `}>
                                    <div className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'text-blue-400' : 'text-slate-300'}`}>
                                        {day.toLocaleDateString('fr-FR', { weekday: 'long' })}
                                    </div>
                                    <div className={`text-3xl font-black mt-1 ${isToday ? 'text-blue-400' : 'text-white'}`}>
                                        {day.getDate()}
                                    </div>
                                    <div className={`text-[10px] font-medium uppercase mt-1 ${isToday ? 'text-blue-300' : 'text-slate-400'}`}>
                                        {day.toLocaleDateString('fr-FR', { month: 'short' })}
                                    </div>
                                </div>

                                {/* Games List - Using FULL GameCard */}
                                <div className="flex flex-col gap-4">
                                    {dayGames.map((game, idx) => (
                                        <div
                                            key={game.id}
                                            className="animate-fade-in-up"
                                            style={{ animationDelay: `${idx * 50}ms` }}
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
};

export default DesktopGrid;
