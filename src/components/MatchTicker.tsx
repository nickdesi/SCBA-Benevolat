import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Game } from '../types';
import { getTodayISO, getRelativeDateInfo, isGamePast, formatDateShort } from '../utils/dateUtils';
import { scrollToGameCard } from '../utils/scrollUtils';
import { getGameRoleStats, isGameUrgent } from '../utils/gameUtils';
import { Clock, MapPin, Flame, Users } from 'lucide-react';

interface MatchTickerProps {
  games: Game[];
}

const TICKER_SPEED = 40; // Vitesse de défilement (pixels par seconde)

/**
 * Item individuel de match pour le mode défilant des urgences
 */
const TickerItem: React.FC<{
  game: Game;
  onNavigate: (game: Game) => void;
}> = memo(({ game, onNavigate }) => {
  const relativeInfo = getRelativeDateInfo(game.dateISO);
  const roleStats = getGameRoleStats(game);

  const host = game.isHome ? game.team : game.opponent;
  const visitor = game.isHome ? game.opponent : game.team;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(game);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Match urgent : ${host} contre ${visitor} — Voir le match`}
      className="inline-flex items-center gap-2 px-3 py-1 text-xs cursor-pointer hover:bg-white/10 transition-colors rounded-lg flex-shrink-0 group"
    >
      {/* Badge Urgent Pulsant */}
      <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-900/80 text-red-200 border border-red-700/60 animate-pulse">
        <Flame className="w-3 h-3 text-red-400" aria-hidden="true" />
        Urgent
      </span>

      {/* Pastille délai relatif (Aujourd'hui, Demain, Dans 2j, etc.) */}
      <span className="font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border bg-slate-800/80 text-slate-200 border-slate-700/60">
        {relativeInfo.label}
      </span>

      {/* Date courte & Heure */}
      <span className="flex items-center gap-1 text-slate-200 text-xs font-bold flex-shrink-0">
        <Clock className="w-3 h-3 text-slate-400" aria-hidden="true" />
        <span>{formatDateShort(game.dateISO)}</span>
        <span className="text-slate-500">·</span>
        <span>{game.time}</span>
      </span>

      <span className="text-slate-600 text-xs" aria-hidden="true">
        ·
      </span>

      {/* Équipes */}
      <span className="flex items-center gap-1.5 font-bold uppercase tracking-wide">
        <span className={game.isHome ? 'text-emerald-400 font-black' : 'text-slate-100'}>
          {host}
        </span>
        <span className="text-slate-500 text-[10px] font-black" aria-hidden="true">
          VS
        </span>
        <span className={!game.isHome ? 'text-emerald-400 font-black' : 'text-slate-300'}>
          {visitor}
        </span>
      </span>

      {/* Tag DOM */}
      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-950/60 text-emerald-300 border-emerald-700/50">
        DOM
      </span>

      {/* Salle si disponible */}
      {game.location && (
        <span className="hidden md:flex items-center gap-1 text-slate-300 text-[11px] max-w-[140px] truncate">
          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{game.location}</span>
        </span>
      )}

      {/* Postes bénévoles manquants */}
      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-red-950/80 text-red-300 border-red-800/50">
        <Users className="w-3 h-3 text-red-400" aria-hidden="true" />
        {roleStats.filledSlots}/{roleStats.totalCapacity} bénévoles
      </span>

      {/* Séparateur entre matchs */}
      <span className="text-red-800/60 mx-2 text-xs select-none" aria-hidden="true">
        •
      </span>
    </button>
  );
});
TickerItem.displayName = 'TickerItem';

/**
 * Composant MatchTicker :
 * - EXCLUSIVEMENT RÉSERVÉ AUX URGENCES (matchs domicile dans les 48h non complets en bénévoles)
 * - Si 0 urgence : composant masqué (return null)
 * - Si 1 urgence : Bannière compacte et centrée sur PC (sans boucler inutilement sur le même match)
 * - Si 2+ urgences : Ticker défilant fluide animé (Marquee avec pause au survol et clic de navigation)
 * - Calcul calendaire strict : J = Aujourd'hui, J+1 = Demain, J+2 = Dans 2j, etc.
 */
const MatchTicker: React.FC<MatchTickerProps> = memo(({ games }) => {
  const todayISO = getTodayISO();

  // Liste EXCLUSIVEMENT réservée aux matchs urgents
  const urgentGames = useMemo<Game[]>(() => {
    const now = new Date();
    const list: Game[] = [];

    for (const g of games) {
      const iso = g.dateISO ?? '';
      if (!iso || iso < todayISO) continue;
      if (isGamePast(iso, g.time, now)) continue;
      if (isGameUrgent(g, now)) {
        list.push(g);
      }
    }

    return list;
  }, [games, todayISO]);

  // Navigation fluide vers le match
  const handleNavigate = useCallback((game: Game) => {
    if (game.dateISO) {
      window.dispatchEvent(
        new CustomEvent('ticker:navigate', {
          detail: { dateISO: game.dateISO, gameId: game.id },
        }),
      );
    }
    if (!scrollToGameCard(game.id)) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (scrollToGameCard(game.id) || attempts >= 25) clearInterval(interval);
      }, 50);
    }
  }, []);

  // Références d'animation pour le mode Ticker défilant
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const pausedRef = useRef(false);
  const copyWidthRef = useRef(0);

  const tick = useCallback((timestamp: number) => {
    if (!trackRef.current) return;

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    if (!pausedRef.current) {
      const delta = (timestamp - lastTimeRef.current) / 1000;
      offsetRef.current += delta * TICKER_SPEED;

      if (copyWidthRef.current > 0 && offsetRef.current >= copyWidthRef.current) {
        offsetRef.current -= copyWidthRef.current;
      }

      trackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
    }

    lastTimeRef.current = timestamp;
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (urgentGames.length < 2) return;

    const measureAndStart = () => {
      if (copyRef.current) {
        copyWidthRef.current = copyRef.current.getBoundingClientRect().width;
      }
      lastTimeRef.current = 0;
      offsetRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    };

    const raf = requestAnimationFrame(measureAndStart);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(rafRef.current);
    };
  }, [urgentGames.length, tick]);

  // Pas d'urgence -> Aucun affichage
  if (urgentGames.length === 0) return null;

  // CAS 1 : UNE SEULE URGENCE -> Bannière élégante et compacte centrée sur PC
  if (urgentGames.length === 1) {
    const singleGame = urgentGames[0];
    const relativeInfo = getRelativeDateInfo(singleGame.dateISO);
    const roleStats = getGameRoleStats(singleGame);
    const host = singleGame.isHome ? singleGame.team : singleGame.opponent;
    const visitor = singleGame.isHome ? singleGame.opponent : singleGame.team;

    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full min-h-[42px] border-b bg-red-950/95 border-red-900/60 dark:bg-red-950/95 dark:border-red-800/60 transition-colors duration-150"
      >
        <button
          type="button"
          onClick={() => handleNavigate(singleGame)}
          aria-label={`Match urgent : ${host} contre ${visitor} — Voir le match`}
          className="w-full max-w-5xl mx-auto px-4 py-2 flex items-center justify-center gap-2.5 sm:gap-3.5 flex-wrap sm:flex-nowrap cursor-pointer group text-xs text-left sm:text-center"
        >
          {/* Badge Urgent Clignotant */}
          <span className="flex-shrink-0 flex items-center gap-1 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-900/80 text-red-200 border border-red-700/60 animate-pulse">
            <Flame className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
            Urgent
          </span>

          {/* Pastille compte à rebours (Aujourd'hui, Demain, Dans 2j, etc.) */}
          <span className="flex-shrink-0 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-200 border border-slate-700/60">
            {relativeInfo.label}
          </span>

          {/* Date courte & Heure */}
          <span className="flex-shrink-0 flex items-center gap-1.5 text-slate-200 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{formatDateShort(singleGame.dateISO)}</span>
            <span className="text-slate-500">·</span>
            <span>{singleGame.time}</span>
          </span>

          <span className="hidden sm:inline text-red-800/70 text-xs" aria-hidden="true">
            ·
          </span>

          {/* Équipes */}
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={`font-black text-xs uppercase tracking-wide ${
                singleGame.isHome ? 'text-emerald-400' : 'text-slate-100'
              }`}
            >
              {host}
            </span>
            <span
              className="text-slate-500 text-[10px] font-black flex-shrink-0"
              aria-hidden="true"
            >
              VS
            </span>
            <span
              className={`font-bold text-xs uppercase tracking-wide ${
                !singleGame.isHome ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              {visitor}
            </span>
          </span>

          {/* Tag DOM */}
          <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-950/60 text-emerald-300 border-emerald-700/50">
            DOM
          </span>

          {/* Lieu */}
          {singleGame.location && (
            <span className="hidden md:flex flex-shrink-0 items-center gap-1 text-slate-300 text-xs font-medium max-w-[180px] truncate">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">{singleGame.location}</span>
            </span>
          )}

          {/* Statut bénévoles manquants */}
          <span className="flex-shrink-0 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-red-900/60 text-red-200 border-red-700/50">
            <Users className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
            {roleStats.filledSlots}/{roleStats.totalCapacity} bénévoles
          </span>

          {/* Flèche CTA */}
          <span
            className="flex-shrink-0 text-slate-400 group-hover:text-white transition-colors text-xs ml-1"
            aria-hidden="true"
          >
            →
          </span>
        </button>
      </motion.div>
    );
  }

  // CAS 2 : PLUSIEURS URGENCES (>= 2) -> Ticker défilant fluide animé (Marquee)
  return (
    <div
      role="region"
      aria-label="Bandeau des matchs urgents"
      className="relative z-30 border-b border-red-900/60 dark:border-red-800/60 bg-red-950/95 dark:bg-red-950/95 overflow-hidden h-[38px] flex items-center"
    >
      {/* Fondu de bord gauche */}
      <div
        className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-red-950 to-transparent z-20 pointer-events-none"
        aria-hidden="true"
      />

      {/* Fondu de bord droit */}
      <div
        className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-red-950 to-transparent z-20 pointer-events-none"
        aria-hidden="true"
      />

      {/* Piste de défilement requestAnimationFrame avec pause au hover sur PC */}
      <div
        ref={trackRef}
        className="flex items-center will-change-transform"
        onMouseEnter={() => {
          if (
            typeof window !== 'undefined' &&
            window.matchMedia('(hover: hover) and (pointer: fine)').matches
          ) {
            pausedRef.current = true;
          }
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
      >
        {/* Copie 1 (mesurée pour la largeur) */}
        <div ref={copyRef} className="flex items-center flex-shrink-0">
          {urgentGames.map((game, idx) => (
            <TickerItem key={`a-${game.id}-${idx}`} game={game} onNavigate={handleNavigate} />
          ))}
        </div>

        {/* Copie 2 (clone pour boucle infinie transparente) */}
        <div className="flex items-center flex-shrink-0" aria-hidden="true">
          {urgentGames.map((game, idx) => (
            <TickerItem key={`b-${game.id}-${idx}`} game={game} onNavigate={handleNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
});

MatchTicker.displayName = 'MatchTicker';

export default MatchTicker;
