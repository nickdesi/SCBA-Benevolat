import React, { memo } from 'react';
import type { Game, CarpoolEntry } from '../types';
import GameCard from './GameCard';

interface GameListProps {
    games: Game[];
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

interface GameGroup {
    label: string;
    games: Game[];
}

/**
 * Groups games by month/year for display
 */
const groupGamesByMonth = (games: Game[]): GameGroup[] => {
    const groups: GameGroup[] = [];

    games.forEach(game => {
        let label = "Date inconnue";

        if (game.dateISO) {
            const date = new Date(game.dateISO);
            if (!isNaN(date.getTime())) {
                label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                label = label.charAt(0).toUpperCase() + label.slice(1);
            }
        } else {
            const parts = game.date.split(' ');
            if (parts.length > 2) {
                label = parts.length > 2 ? parts.slice(2).join(' ') : game.date;
            }
        }

        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.label === label) {
            lastGroup.games.push(game);
        } else {
            groups.push({ label, games: [game] });
        }
    });

    return groups;
};

const GameList: React.FC<GameListProps> = memo(({
    games,
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
    isAuthenticated
}) => {
    const groups = groupGamesByMonth(games);

    if (games.length === 0) {
        return null;
    }

    return (
        <div className="space-y-12">
            {groups.map((group, groupIdx) => (
                <div key={`${group.label}-${groupIdx}`}>
                    {/* Month Header - Modern pill style */}
                    <div className="flex items-center justify-center my-10">
                        <div className="inline-flex items-center gap-3 px-6 py-3 
                          bg-gradient-to-r from-slate-800 to-slate-700 
                          rounded-full shadow-lg shadow-slate-900/20">
                            <span className="text-2xl">📅</span>
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-lg font-black text-white tracking-wide">
                                    {group.label}
                                </span>
                                <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">
                                    {group.games.filter(g => g.isHome !== false).length} Dom • {group.games.filter(g => g.isHome === false).length} Ext
                                </span>
                            </div>
                            <span className="text-sm font-bold px-2.5 py-0.5 bg-white/20 text-white/90 rounded-full ml-2">
                                {group.games.length} matchs
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {group.games.map((game, index) => (
                            <div
                                key={game.id}
                                className="animate-fade-in-up"
                                style={{ animationDelay: `${index * 50}ms` }}
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
            ))}
        </div>
    );
});

GameList.displayName = 'GameList';

export default GameList;
