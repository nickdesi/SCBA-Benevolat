import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Game, CarpoolEntry } from '../../types';
import GameCard from '../GameCard';
import { toISODateString, getDaysOfWeek, getTodayISO } from '../../utils/dateUtils';

// ⚡ Bolt: Cache Intl.DateTimeFormat to avoid performance hit of Date.toLocaleDateString in list rendering
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

interface MobileTimelineProps {
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

// Optimized animation variants - snappy feel
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const dayVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 30,
    },
  },
};

const gameVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 600,
      damping: 35,
    },
  },
};

const emptyVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 0.6,
    scale: 1,
    transition: { duration: 0.4 },
  },
};

const MobileTimeline: React.FC<MobileTimelineProps> = memo(
  ({
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
    // Memoized week calculation using shared utility
    const days = useMemo(
      () => getDaysOfWeek(currentDate),
      [currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()],
    );

    // Pre-compute games grouped by day to avoid O(N) filtering inside map
    const gamesByDay = useMemo(() => {
      const map = new Map<string, { games: Game[]; homeCount: number; awayCount: number }>();
      for (const game of games) {
        const existing = map.get(game.dateISO) || { games: [], homeCount: 0, awayCount: 0 };
        existing.games.push(game);
        if (game.isHome) {
          existing.homeCount++;
        } else {
          existing.awayCount++;
        }
        map.set(game.dateISO, existing);
      }
      // ⚡ Bolt Optimization: Removed redundant O(N log N) sorting loop here.
      // The `games` prop is already strictly sorted by date and time via `sortGames()`.
      // Iterating sequentially and pushing to the map naturally preserves this exact optimal order,
      // avoiding redundant rendering overhead and preventing lexical string comparison bugs (e.g., "9h00" > "10h00").
      return map;
    }, [games]);

    const getGamesForDay = (date: Date) => {
      return gamesByDay.get(toISODateString(date)) || { games: [], homeCount: 0, awayCount: 0 };
    };

    // Filter out days with no games using pre-computed map
    const activeDays = days.filter((day) => getGamesForDay(day).games.length > 0);

    // ⚡ Bolt Optimization: Hoist new Date() calculation outside the loop to prevent O(N) redundant Date object allocations and formatting during render.
    const todayISO = getTodayISO();

    return (
      <motion.div
        className="lg:hidden flex flex-col gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {activeDays.length > 0 ? (
            activeDays.map((day) => {
              const dayStr = toISODateString(day);
              const { games: dayGames, homeCount, awayCount } = getGamesForDay(day);
              const isToday = dayStr === todayISO;

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
                    <div
                      className={`
                        inline-flex items-center gap-2 sm:gap-3 px-4 py-2 sm:py-2.5 rounded-2xl shadow-lg z-10 relative border
                        ${
                          isToday
                            ? 'bg-gradient-to-r from-[#3629e1] via-[#272890] to-[#aa2e0f] text-white border-white/20 shadow-indigo-500/25'
                            : 'bg-slate-900/90 text-white border-slate-700/60 shadow-slate-950/40 backdrop-blur-md'
                        }
                      `}
                    >
                      <span className="text-base sm:text-xl" aria-hidden="true">
                        {isToday ? '🔥' : '📅'}
                      </span>
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-xs sm:text-sm font-sport font-black text-white tracking-wide uppercase">
                          {isToday ? "Aujourd'hui" : dateFormatter.format(day)}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-90 mt-0.5">
                          <span className="text-emerald-300">{homeCount} Domicile</span>
                          <span className="text-white/40">•</span>
                          <span className="text-blue-300">{awayCount} Extérieur</span>
                        </span>
                      </div>
                      <span className="self-center flex flex-col items-center text-center font-sport font-black px-2.5 py-1 bg-white/15 text-white rounded-xl ml-2 border border-white/10">
                        <span className="text-sm leading-none">{dayGames.length}</span>
                        <span className="text-[9px] leading-none tracking-widest uppercase">
                          {dayGames.length > 1 ? 'matchs' : 'match'}
                        </span>
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
                    {dayGames.map((game) => (
                      <motion.div key={game.id} variants={gameVariants} layout>
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
      </motion.div>
    );
  },
);

MobileTimeline.displayName = 'MobileTimeline';

export default MobileTimeline;
