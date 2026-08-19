import React, { memo, useMemo } from 'react';
import Marquee from 'react-fast-marquee';
import { useReducedMotion } from 'framer-motion';
import type { Game } from '../types';
import { getTodayISO } from '../utils/dateUtils';

interface MatchTickerProps {
  games: Game[];
}

interface TickerGame extends Game {
  _formattedDate?: string;
}

// ⚡ Bolt: Cache Intl.DateTimeFormat outside component to avoid extremely slow Date.toLocaleDateString in render loops
const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' });

const SafeMarquee = (
  typeof Marquee === 'function'
    ? Marquee
    : (Marquee as unknown as { default?: React.ComponentType<Record<string, unknown>> })?.default ||
      'div'
) as React.ElementType;

// ⚡ Bolt: Wrapped MatchTicker in React.memo to prevent unnecessary re-renders when parent states change.
const MatchTicker: React.FC<MatchTickerProps> = memo(({ games }) => {
  const prefersReducedMotion = useReducedMotion();

  // ⚡ Bolt: Use an early-exit O(K) loop instead of O(N log N) filter/sort/slice chain.
  // Performance impact: The `games` array is already globally sorted by `sortGames` (Date + Time).
  // We avoid iterating over all past games and avoid a redundant sorting pass. We stop exactly after finding 10 matches.
  const upcomingGames = useMemo(() => {
    const todayISO = getTodayISO();
    const upcoming: TickerGame[] = [];

    for (let i = 0; i < games.length; i++) {
      const g = games[i];
      if (g.dateISO && g.dateISO >= todayISO) {
        // ⚡ Bolt Optimization: Pre-compute formatted date strings during the memoized phase
        // Why: Avoids O(K) redundant Date object allocations and Intl string formatting on every render cycle.
        // Impact: Reduces garbage collection pressure and CPU overhead for smoother UI performance.
        upcoming.push({
          ...g,
          _formattedDate: dateFormatter.format(new Date(g.dateISO)),
        });
        if (upcoming.length === 10) break;
      }
    }

    return upcoming;
  }, [games]);

  // Reserve space even when empty to prevent CLS (layout shift)
  if (upcomingGames.length === 0) {
    return <div className="h-[53px] bg-slate-950" aria-hidden="true" />;
  }

  const tickerItems = upcomingGames.map((game, i) => {
    // Determine Host and Visitor
    const host = game.isHome ? game.team : game.opponent;
    const visitor = game.isHome ? game.opponent : game.team;

    return (
      <div
        key={`${game.id}-${i}`}
        className="flex items-center gap-4 mr-16 select-none group border-r border-slate-800/50 pr-4 last:border-0"
      >
        {/* Date & Time Group */}
        <div className="flex flex-col items-end leading-none min-w-[50px]">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">
            {game._formattedDate || ''}
          </span>
          <span className="text-xs font-bold text-white font-mono">{game.time}</span>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold uppercase tracking-tight ${game.isHome ? 'text-emerald-400' : 'text-slate-400'}`}
            >
              {host}
            </span>
          </div>

          <div className="flex flex-col items-center px-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
              VS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold uppercase tracking-tight ${!game.isHome ? 'text-blue-400' : 'text-slate-400'}`}
            >
              {visitor}
            </span>
          </div>
        </div>

        {/* Location/Type Indicator */}
        <div
          className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold shadow-sm ring-1 ring-inset
                    ${
                      game.isHome
                        ? 'bg-emerald-950/30 text-emerald-400 ring-emerald-500/20'
                        : 'bg-blue-950/30 text-blue-400 ring-blue-500/20'
                    }
                `}
        >
          <span aria-hidden="true">{game.isHome ? '🏠' : '✈️'}</span>
        </div>
      </div>
    );
  });

  return (
    <div className="relative z-30 border-b border-slate-800 bg-slate-950 overflow-hidden py-2.5">
      {/* Gradient Overlay for modern feel */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-transparent to-emerald-900/10 pointer-events-none z-10" />

      {prefersReducedMotion ? (
        <div className="flex overflow-x-auto scrollbar-hide px-4">{tickerItems}</div>
      ) : (
        <SafeMarquee
          speed={35}
          gradient={true}
          gradientColor="2, 6, 23" // slate-950 as string
          gradientWidth={50}
          pauseOnHover={true}
          autoFill={true}
          className="!overflow-y-hidden"
        >
          {tickerItems}
        </SafeMarquee>
      )}
    </div>
  );
});

MatchTicker.displayName = 'MatchTicker';

export default MatchTicker;
