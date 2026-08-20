import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Game } from '../types';
import { getTodayISO } from '../utils/dateUtils';

interface MatchTickerProps {
  games: Game[];
}

interface TickerGame extends Game {
  _formattedDate?: string;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' });
const SPEED = 40; // pixels per second — same on all devices

/** Single ticker match item */
const TickerItem: React.FC<{ game: TickerGame }> = memo(({ game }) => {
  const host = game.isHome ? game.team : game.opponent;
  const visitor = game.isHome ? game.opponent : game.team;
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const navigateToGame = useCallback(() => {
    // 1. Dispatch custom event so PlanningView switches to the appropriate week and auto-scrolls
    if (game.dateISO) {
      window.dispatchEvent(
        new CustomEvent('ticker:navigate', { detail: { dateISO: game.dateISO, gameId: game.id } }),
      );
    }

    // 2. Immediate or retry scroll in case we are already on the current week or in list view
    const scrollToCard = () => {
      const el = document.getElementById(`game-${game.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2');
        setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2'), 1500);
        return true;
      }
      return false;
    };

    if (!scrollToCard()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (scrollToCard() || attempts >= 25) {
          clearInterval(interval);
        }
      }, 60);
    }
  }, [game.dateISO, game.id]);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    const dt = Date.now() - pointerStartRef.current.time;
    pointerStartRef.current = null;

    // Trigger navigation on valid tap or click (< 15px movement and < 600ms duration)
    if (dx < 15 && dy < 15 && dt < 600) {
      navigateToGame();
    }
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={navigateToGame}
      aria-label={`Accéder au match ${host} contre ${visitor}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0 40px 0 0',
        margin: 0,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        fontSize: '11px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.3)',
      }}
    >
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
    </button>
  );
});
TickerItem.displayName = 'TickerItem';

const MatchTicker: React.FC<MatchTickerProps> = memo(({ games }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const pausedRef = useRef(false);
  const copyWidthRef = useRef(0);

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

  /** The core animation loop — runs via requestAnimationFrame */
  const tick = useCallback((timestamp: number) => {
    if (!trackRef.current) return;

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    if (!pausedRef.current) {
      const delta = (timestamp - lastTimeRef.current) / 1000; // seconds elapsed
      offsetRef.current += delta * SPEED;

      // Reset seamlessly when we've scrolled past one full copy
      if (copyWidthRef.current > 0 && offsetRef.current >= copyWidthRef.current) {
        offsetRef.current -= copyWidthRef.current;
      }

      trackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
    }

    lastTimeRef.current = timestamp;
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (upcomingGames.length === 0) return;

    // Measure after render
    const measureAndStart = () => {
      if (copyRef.current) {
        copyWidthRef.current = copyRef.current.getBoundingClientRect().width;
      }
      lastTimeRef.current = 0;
      offsetRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    };

    // Wait one frame for layout
    const raf = requestAnimationFrame(measureAndStart);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(rafRef.current);
    };
  }, [upcomingGames, tick]);

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

      {/* Track: JS-driven translateX via requestAnimationFrame */}
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          willChange: 'transform',
        }}
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
      >
        {/* Copy 1 — measured */}
        <div ref={copyRef} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {upcomingGames.map((game, i) => (
            <TickerItem key={`a-${game.id}-${i}`} game={game} />
          ))}
        </div>
        {/* Copy 2 — seamless clone */}
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
