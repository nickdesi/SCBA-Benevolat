import React, { memo, useMemo } from 'react';
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
  homeCount: number;
  awayCount: number;
}

// Cache Intl.DateTimeFormat for performance (drastically faster than toLocaleDateString in loops)
const monthYearFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

/**
 * Groups games by month/year for display
 */
const groupGamesByMonth = (games: Game[]): GameGroup[] => {
  const groups: GameGroup[] = [];

  // ⚡ Bolt Optimization: Cache the formatted month label using local Year-Month.
  // Instantiating a Date is relatively fast, but calling Intl.DateTimeFormat.format()
  // inside a loop over thousands of items is very slow. By caching on the local
  // year and month, we avoid the heavy Intl formatting while handling timezone shifts correctly.
  const monthLabelCache: Record<string, string> = {};

  games.forEach((game) => {
    let label = 'Date inconnue';

    if (game.dateISO) {
      // ⚡ Bolt Optimization: Use fast string slicing on the ISO date format (YYYY-MM-DD)
      // to generate the cache key without allocating a new Date object.
      // This prevents O(N) Date allocations and garbage collection overhead during React renders.
      const cacheKey = game.dateISO.substring(0, 7);

      if (monthLabelCache[cacheKey]) {
        label = monthLabelCache[cacheKey];
      } else {
        // Construct a safe local date using the 15th of the month to avoid timezone boundaries
        // where new Date('YYYY-MM-DD') parses as UTC midnight and shifts to the previous day locally.
        const [year, month] = cacheKey.split('-').map(Number);
        const date = new Date(year, month - 1, 15);

        if (!isNaN(date.getTime())) {
          let formattedLabel = monthYearFormatter.format(date);
          formattedLabel = formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1);
          monthLabelCache[cacheKey] = formattedLabel;
          label = formattedLabel;
        }
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
      if (game.isHome) lastGroup.homeCount++;
      else lastGroup.awayCount++;
    } else {
      groups.push({
        label,
        games: [game],
        homeCount: game.isHome ? 1 : 0,
        awayCount: game.isHome ? 0 : 1,
      });
    }
  });

  return groups;
};

const GameList: React.FC<GameListProps> = memo(
  ({
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
    isAuthenticated,
  }) => {
    const groups = useMemo(() => groupGamesByMonth(games), [games]);

    if (games.length === 0) {
      return null;
    }

    return (
      <div className="space-y-8">
        {groups.map((group, groupIdx) => (
          <section key={`${group.label}-${groupIdx}`} className="relative">
            {/* Native Mobile Sticky Month Header Capsule */}
            <div className="sticky top-[130px] sm:top-[142px] z-20 my-4 transition-all">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3629e1] shadow-xs flex-shrink-0" />
                  <h2 className="font-sport text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                    {group.label}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold flex-shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    {group.homeCount} Dom
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                    {group.awayCount} Ext
                  </span>
                </div>
              </div>
            </div>

            {/* Grille avec items-start : chaque carte a une hauteur indépendante au dépliement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
              {group.games.map((game, index) => (
                <div key={game.id} className="w-full flex flex-col cv-auto self-start">
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
                    onEditRequest={onEditRequest}
                    onCancelEdit={onCancelEdit}
                    onDeleteRequest={onDeleteRequest}
                    onUpdateRequest={onUpdateRequest}
                    userRegistrations={userRegistrations}
                    isAuthenticated={isAuthenticated}
                    index={index}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  },
);

GameList.displayName = 'GameList';

export default GameList;
