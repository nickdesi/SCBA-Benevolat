import React from 'react';
import { Game } from '../../types';
import { MapPin, Users, Calendar, Clock } from 'lucide-react';

interface PlanningGameCardProps {
  game: Game;
  onClick?: () => void;
}

// Check if a role is considered "complete"
const isRoleComplete = (role: { capacity: number; volunteers: string[] }): boolean => {
  const isUnlimited = role.capacity === Infinity || role.capacity === 0;
  if (isUnlimited) {
    return role.volunteers.length >= 2;
  }
  return role.volunteers.length >= role.capacity;
};

const PlanningGameCard: React.FC<PlanningGameCardProps> = ({ game, onClick }) => {
  // Calculate missing volunteers
  const totalCapacity = game.roles.reduce((acc, role) => {
    const isUnlimited = role.capacity === Infinity || role.capacity === 0;
    return acc + (isUnlimited ? 2 : role.capacity);
  }, 0);
  const filledSpots = game.roles.reduce((acc, role) => acc + role.volunteers.length, 0);
  const isFullyStaffed = game.roles.every(isRoleComplete);

  // Get missing roles
  const getMissingRoles = () => {
    return game.roles
      .filter(r => !isRoleComplete(r))
      .map(r => r.name);
  };

  // Default to home game if isHome is not defined
  const isHomeGame = game.isHome ?? true;

  // Calculate carpool seats
  const totalCarpoolSeats = React.useMemo(() => {
    if (!game.carpool) return 0;
    return game.carpool
      .filter(e => e.type === 'driver')
      .reduce((sum, driver) => sum + (driver.seats || 0), 0);
  }, [game.carpool]);

  return (
    <div
      onClick={onClick}
      className={`
        relative group cursor-pointer overflow-hidden rounded-2xl transition-all duration-150
        border shadow-sm hover:shadow-lg hover:scale-[1.01]
        bg-slate-900 dark:bg-slate-900
        ${isFullyStaffed ? 'ring-2 ring-emerald-400 dark:ring-emerald-600' : 'border-slate-700 dark:border-slate-700'}
      `}
    >
      {/* Header with STRONG color distinction - EXACT GameCard style */}
      <div className={`relative p-4 overflow-hidden ${isHomeGame
        ? 'bg-gradient-to-br from-emerald-900/50 via-emerald-900/30 to-slate-900'
        : 'bg-gradient-to-br from-blue-900/50 via-blue-900/30 to-slate-900'
        }`}>
        {/* Watermark Icon */}
        <div className="absolute -right-4 -top-4 text-8xl opacity-10 select-none pointer-events-none">
          {isHomeGame ? '🏟️' : '🚌'}
        </div>

        {/* Top Row: Team + Badges */}
        <div className="relative flex items-start justify-between gap-2 mb-1 z-10">
          <h3 className="text-base font-semibold text-slate-100 leading-tight">{game.team}</h3>
          <div className="flex flex-wrap gap-1.5 items-center flex-shrink-0">
            {/* Home/Away Pill */}
            <span className={`
              px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-full shadow-sm
              ${isHomeGame
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-500 text-white'
              }
            `}>
              {isHomeGame ? '🏠 Domicile' : '🚗 Extérieur'}
            </span>

            {/* Carpool seats badge */}
            {!isHomeGame && totalCarpoolSeats > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-emerald-500/20 text-emerald-400">
                🚗 {totalCarpoolSeats}
              </span>
            )}

            {/* Status Badge */}
            {isFullyStaffed && (
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-emerald-500/20 text-emerald-400">
                ✓ Complet
              </span>
            )}
          </div>
        </div>

        {/* Opponent */}
        <p className="text-lg font-bold text-slate-200 mb-2">
          vs <span className="text-red-400">{game.opponent}</span>
        </p>

        {/* Meta Info: Date • Time on first line, Location on second line */}
        <div className="text-xs text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {game.date}
            </span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {game.time}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {!isHomeGame ? (
              <a
                href={`https://waze.com/ul?q=${encodeURIComponent(game.location)}&navigate=yes`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
                title="Ouvrir dans Waze"
                onClick={(e) => e.stopPropagation()}
              >
                {game.location}
              </a>
            ) : (
              <span>{game.location}</span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Bar: Volunteers Info */}
      <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700/50">
        {isHomeGame && (
          <span className={`text-sm font-medium ${isFullyStaffed ? 'text-emerald-400' : 'text-slate-300'}`}>
            {isFullyStaffed ? (
              <>🎉 Équipe complète !</>
            ) : (
              <>
                <span className="font-bold">{filledSpots}/{totalCapacity}</span> bénévoles
                {getMissingRoles().length > 0 && (
                  <span className="text-slate-500 ml-1.5">
                    • Manque : <span className="text-red-400 font-medium">{getMissingRoles().join(', ')}</span>
                  </span>
                )}
              </>
            )}
          </span>
        )}
        {!isHomeGame && (
          <span className="text-sm font-medium text-slate-300">
            🚗 {(game.carpool?.length || 0)} inscription{(game.carpool?.length || 0) > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
};

export default PlanningGameCard;
