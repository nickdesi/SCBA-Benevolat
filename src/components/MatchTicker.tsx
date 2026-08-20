import React, { memo, useMemo } from 'react';
import type { Game } from '../types';
import { getTodayISO } from '../utils/dateUtils';

interface MatchTickerProps {
  games: Game[];
}

interface TickerGame extends Game {
  _formattedDate?: string;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' });

const MatchTicker: React.FC<MatchTickerProps> = memo(({ games }) => {
  const upcomingGames = useMemo(() => {
    const todayISO = getTodayISO();
    const upcoming: TickerGame[] = [];

    for (let i = 0; i < games.length; i++) {
      const g = games[i];
      if (g.dateISO && g.dateISO >= todayISO) {
        upcoming.push({
          ...g,
          _formattedDate: dateFormatter.format(new Date(g.dateISO)),
        });
        if (upcoming.length === 12) break;
      }
    }

    return upcoming;
  }, [games]);

  if (upcomingGames.length === 0) {
    return null;
  }

  // Duplicate items 4 times to ensure seamless infinite scrolling even on ultra-wide / 4K displays
  const repeatedGames = [...upcomingGames, ...upcomingGames, ...upcomingGames, ...upcomingGames];

  return (
    <div className="relative z-30 border-b border-slate-800/80 bg-slate-950/95 overflow-hidden py-1 backdrop-blur-md">
      {/* Edge gradient masks for seamless fade */}
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none z-20" />
      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none z-20" />

      {/* Hardware-accelerated continuous scrolling track */}
      <div className="scba-ticker-track flex items-center select-none">
        {repeatedGames.map((game, idx) => {
          const host = game.isHome ? game.team : game.opponent;
          const visitor = game.isHome ? game.opponent : game.team;

          return (
            <div
              key={`${game.id}-${idx}`}
              className="inline-flex items-center gap-2 mr-8 text-xs whitespace-nowrap pl-2"
            >
              {/* Date & Hour badge */}
              <span className="font-mono text-[10px] font-semibold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                {game._formattedDate} {game.time}
              </span>

              {/* Host Team */}
              <span
                className={`font-bold font-sport uppercase tracking-tight text-[11px] sm:text-xs ${
                  game.isHome ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {host}
              </span>

              <span className="text-[9px] font-black text-slate-600 px-0.5">VS</span>

              {/* Visitor Team */}
              <span
                className={`font-bold font-sport uppercase tracking-tight text-[11px] sm:text-xs ${
                  !game.isHome ? 'text-blue-400' : 'text-slate-300'
                }`}
              >
                {visitor}
              </span>

              {/* Minimalist Home/Away Pill */}
              <span
                className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  game.isHome
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                    : 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                }`}
              >
                {game.isHome ? 'DOM' : 'EXT'}
              </span>

              {/* Separator dot */}
              <span className="text-slate-700 ml-3">•</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

MatchTicker.displayName = 'MatchTicker';

export default MatchTicker;
