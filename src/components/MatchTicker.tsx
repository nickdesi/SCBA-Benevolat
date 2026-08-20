import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Game } from '../types';
import { getTodayISO } from '../utils/dateUtils';

interface MatchTickerProps {
  games: Game[];
}

interface TickerGame extends Game {
  _formattedDate?: string;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' });

const SPEED_PX_PER_SEC = 50; // 50px/s → comfortable reading on all screens

/** Single ticker item */
const TickerItem: React.FC<{ game: TickerGame }> = ({ game }) => {
  const host = game.isHome ? game.team : game.opponent;
  const visitor = game.isHome ? game.opponent : game.team;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        paddingRight: '40px',
        fontSize: '11px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
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
          letterSpacing: '0.04em',
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
          letterSpacing: '0.04em',
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

      <span style={{ color: '#1e293b' }}>•</span>
    </span>
  );
};

const MatchTicker: React.FC<MatchTickerProps> = memo(({ games }) => {
  const copyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(30);
  const [ready, setReady] = useState(false);

  const upcomingGames = useMemo(() => {
    const todayISO = getTodayISO();
    const upcoming: TickerGame[] = [];
    for (const g of games) {
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

  /** Measure the real pixel width of one copy, then set animation duration accordingly */
  const measure = useCallback(() => {
    if (!copyRef.current) return;
    const w = copyRef.current.getBoundingClientRect().width;
    if (w > 0) {
      const dur = Math.round(w / SPEED_PX_PER_SEC);
      setDuration(Math.max(dur, 8));
      if (trackRef.current) {
        // Inject the exact pixel offset as a CSS variable so the keyframe is precise
        trackRef.current.style.setProperty('--ticker-shift', `-${w}px`);
      }
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (upcomingGames.length === 0) return;
    // Give the browser one frame to render, then measure
    const raf = requestAnimationFrame(() => {
      measure();
    });
    return () => cancelAnimationFrame(raf);
  }, [upcomingGames, measure]);

  if (upcomingGames.length === 0) return null;

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 30,
        borderBottom: '1px solid rgba(30,41,59,0.8)',
        background: 'rgba(2,6,23,0.95)',
        overflow: 'hidden',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Edge fades */}
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

      {/*
       * Track: 2 identical copies side by side.
       * Animation shifts by --ticker-shift (= -scrollWidth of copy 1 in px).
       * Duration is computed so speed = SPEED_PX_PER_SEC regardless of content length.
       */}
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          willChange: 'transform',
          // Only animate after measurement to avoid a flash of wrong position
          animation: ready ? `scba-ticker-px ${duration}s linear infinite` : 'none',
        }}
        onMouseEnter={() => {
          if (trackRef.current) trackRef.current.style.animationPlayState = 'paused';
        }}
        onMouseLeave={() => {
          if (trackRef.current) trackRef.current.style.animationPlayState = 'running';
        }}
      >
        {/* Copy 1 — measured via copyRef */}
        <div ref={copyRef} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {upcomingGames.map((game, i) => (
            <TickerItem key={`a-${game.id}-${i}`} game={game} />
          ))}
        </div>
        {/* Copy 2 — seamless clone, no ref needed */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {upcomingGames.map((game, i) => (
            <TickerItem key={`b-${game.id}-${i}`} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
});

MatchTicker.displayName = 'MatchTicker';

export default MatchTicker;
