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

/** Renders a single ticker item (used twice: original + clone) */
const TickerItem: React.FC<{ game: TickerGame; idx: number }> = ({ game, idx }) => {
  const host = game.isHome ? game.team : game.opponent;
  const visitor = game.isHome ? game.opponent : game.team;

  return (
    <span
      className="inline-flex items-center gap-2 pr-10 text-xs whitespace-nowrap"
      aria-label={`${host} vs ${visitor}`}
      key={idx}
    >
      {/* Date badge */}
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '10px',
          fontWeight: 600,
          color: '#94a3b8',
          background: '#0f172a',
          padding: '1px 5px',
          borderRadius: '4px',
          border: '1px solid #1e293b',
        }}
      >
        {game._formattedDate} {game.time}
      </span>

      {/* Host */}
      <span
        style={{
          fontWeight: 700,
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          color: game.isHome ? '#34d399' : '#cbd5e1',
        }}
      >
        {host}
      </span>

      <span style={{ fontSize: '9px', fontWeight: 900, color: '#334155' }}>VS</span>

      {/* Visitor */}
      <span
        style={{
          fontWeight: 700,
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          color: !game.isHome ? '#60a5fa' : '#cbd5e1',
        }}
      >
        {visitor}
      </span>

      {/* DOM/EXT pill */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '1px 6px',
          borderRadius: '999px',
          fontSize: '9px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          background: game.isHome ? 'rgba(6,78,59,0.5)' : 'rgba(23,37,84,0.5)',
          color: game.isHome ? '#6ee7b7' : '#93c5fd',
          border: game.isHome
            ? '1px solid rgba(52,211,153,0.25)'
            : '1px solid rgba(96,165,250,0.25)',
        }}
      >
        {game.isHome ? 'DOM' : 'EXT'}
      </span>

      <span style={{ color: '#1e293b', marginLeft: '8px' }}>•</span>
    </span>
  );
};

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
        if (upcoming.length === 15) break;
      }
    }

    return upcoming;
  }, [games]);

  if (upcomingGames.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 30,
        borderBottom: '1px solid rgba(30,41,59,0.8)',
        background: 'rgba(2,6,23,0.95)',
        overflow: 'hidden',
        padding: '4px 0',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Left fade */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '40px',
          background: 'linear-gradient(to right, #020617, transparent)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      />
      {/* Right fade */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '40px',
          background: 'linear-gradient(to left, #020617, transparent)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      />

      {/* Scrolling track — 2 identical copies so -50% = exactly 1 loop */}
      <div className="scba-ticker-track" style={{ display: 'flex', alignItems: 'center' }}>
        {/* Copy 1 */}
        {upcomingGames.map((game, i) => (
          <TickerItem key={`a-${game.id}-${i}`} game={game} idx={i} />
        ))}
        {/* Copy 2 — seamless clone */}
        {upcomingGames.map((game, i) => (
          <TickerItem key={`b-${game.id}-${i}`} game={game} idx={i} />
        ))}
      </div>
    </div>
  );
});

MatchTicker.displayName = 'MatchTicker';

export default MatchTicker;
