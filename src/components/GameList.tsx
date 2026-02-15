import React, { memo, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import type { Game, CarpoolEntry } from '../types';
import GameCard from './GameCard';

interface GameListProps {
    games: Game[];
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
    isAuthenticated
}) => {
    const groups = useMemo(() => groupGamesByMonth(games), [games]);

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
                          bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-900 dark:to-purple-900
                          rounded-full shadow-lg shadow-indigo-500/30 border border-white/10">
                            <Calendar className="w-6 h-6 text-white" />
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-lg font-black text-white tracking-wide">
                                    {group.label}
                                </span>
                                <span className="text-[10px] font-medium uppercase tracking-wider flex items-center gap-1">
                                    <span className="text-emerald-300">{group.games.filter(g => (g.isHome ?? true)).length} Dom</span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-blue-300">{group.games.filter(g => !(g.isHome ?? true)).length} Ext</span>
                                </span>
                            </div>
                            <span className="text-sm font-bold px-2.5 py-0.5 bg-white/20 text-white/90 rounded-full ml-2">
                                {group.games.length} matchs
                            </span>
                        </div>
                    </div>

                    <div className="columns-1 lg:columns-2 gap-6 lg:gap-8 space-y-6 lg:space-y-0">
                        {group.games.map((game, index) => (
                            <div
                                key={game.id}
                                id={`game-${game.id}`}
                                className="break-inside-avoid mb-6 lg:mb-8 cv-auto"
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
                                    index={index}
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
