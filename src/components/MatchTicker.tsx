import React, { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Game } from '../types';
import { getTodayISO } from '../utils/dateUtils';
import { scrollToGameCard } from '../utils/scrollUtils';
import { getGameRoleStats } from '../utils/gameUtils';
import { Clock, MapPin, Flame, CheckCircle, Users } from 'lucide-react';

interface MatchTickerProps {
  games: Game[];
}

/**
 * MatchTicker Phase 4 — "Prochain match" sobre et utilitaire.
 *
 * Remplace le bandeau défilant animé (rAF) par une bannière statique,
 * sobre et dense en information :
 * - Prochain match dans les 72h
 * - Statut de couverture bénévoles (urgent / couvert / X/Y)
 * - Tap → scroll vers la GameCard correspondante
 *
 * Design : dark navy compact, identitaire SCBA, sans animation décorative.
 */
const MatchTicker: React.FC<MatchTickerProps> = memo(({ games }) => {
  const todayISO = getTodayISO();
  const now = Date.now();

  // Prochain match dans les 72h (déjà filtré par App.tsx avant de rendre ce composant)
  const nextGame = useMemo<Game | null>(() => {
    for (const g of games) {
      const iso = g.dateISO ?? '';
      if (!iso || iso < todayISO) continue;
      const d = new Date(iso);
      if (isNaN(d.getTime())) continue;
      const diff = d.getTime() - now;
      if (diff >= 0 && diff <= 72 * 60 * 60 * 1000) return g;
    }
    return null;
  }, [games, todayISO, now]);

  const handleNavigate = useCallback(() => {
    if (!nextGame) return;
    if (nextGame.dateISO) {
      window.dispatchEvent(
        new CustomEvent('ticker:navigate', {
          detail: { dateISO: nextGame.dateISO, gameId: nextGame.id },
        }),
      );
    }
    if (!scrollToGameCard(nextGame.id)) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (scrollToGameCard(nextGame.id) || attempts >= 20) clearInterval(interval);
      }, 60);
    }
  }, [nextGame]);

  if (!nextGame) return null;

  const roleStats = getGameRoleStats(nextGame);
  const isFullyStaffed = roleStats.isFullyStaffed;
  const filledSlots = roleStats.filledSlots;
  const totalCapacity = roleStats.totalCapacity;

  // Calcul du délai restant
  const gameDate = nextGame.dateISO ? new Date(nextGame.dateISO) : null;
  const diffMs = gameDate ? gameDate.getTime() - now : null;
  const diffH = diffMs !== null ? Math.floor(diffMs / 3_600_000) : null;
  const isToday = diffH !== null && diffH < 24;
  const isTomorrow = diffH !== null && diffH >= 24 && diffH < 48;

  const countdownLabel = isToday
    ? diffH === 0
      ? "Aujourd'hui"
      : `J-0 · ${diffH}h`
    : isTomorrow
      ? 'Demain'
      : diffH !== null
        ? `Dans ${Math.ceil(diffH / 24)}j`
        : '';

  const isUrgent = nextGame.isHome && !isFullyStaffed && diffH !== null && diffH < 48;

  const host = nextGame.isHome ? nextGame.team : nextGame.opponent;
  const visitor = nextGame.isHome ? nextGame.opponent : nextGame.team;

  return (
    <motion.button
      onClick={handleNavigate}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      aria-label={`Prochain match : ${host} contre ${visitor} — Voir le match`}
      className={`
        w-full min-h-[44px] flex items-center gap-3 px-4 py-2 text-left
        border-b cursor-pointer group transition-colors duration-150
        ${
          isUrgent
            ? 'bg-red-950/95 border-red-900/60 hover:bg-red-900/95 dark:bg-red-950/95 dark:border-red-800/60'
            : 'bg-slate-900/95 border-slate-800/80 hover:bg-slate-800/95 dark:bg-[#0b1320]/95 dark:border-slate-700/60'
        }
      `}
    >
      {/* Countdown pill */}
      <span
        className={`flex-shrink-0 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
          isToday
            ? 'bg-red-500/25 text-red-300 border border-red-500/30'
            : 'bg-slate-700/60 text-slate-300 border border-slate-600/40'
        }`}
      >
        {countdownLabel}
      </span>

      {/* Heure */}
      <span className="flex-shrink-0 flex items-center gap-1.5 text-slate-300 text-xs font-bold">
        <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
        {nextGame.time}
      </span>

      {/* Séparateur */}
      <span className="flex-shrink-0 text-slate-600 text-xs" aria-hidden="true">
        ·
      </span>

      {/* Équipes */}
      <span className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
        <span
          className={`font-black text-xs uppercase tracking-wide truncate ${
            nextGame.isHome ? 'text-emerald-400' : 'text-slate-100'
          }`}
        >
          {host}
        </span>
        <span className="text-slate-500 text-[10px] font-black flex-shrink-0" aria-hidden="true">
          VS
        </span>
        <span className="font-bold text-xs uppercase tracking-wide text-slate-300 truncate">
          {visitor}
        </span>
      </span>

      {/* Lieu (desktop uniquement) */}
      {nextGame.location && (
        <span className="hidden sm:flex flex-shrink-0 items-center gap-1 text-slate-400 text-xs font-medium max-w-[140px] truncate">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" aria-hidden="true" />
          {nextGame.location}
        </span>
      )}

      {/* Statut couverture — matchs domicile uniquement */}
      {nextGame.isHome && (
        <span
          className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
            isFullyStaffed
              ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40'
              : isUrgent
                ? 'bg-red-900/60 text-red-300 border-red-700/40 animate-pulse'
                : 'bg-slate-800/60 text-slate-300 border-slate-600/40'
          }`}
        >
          {isFullyStaffed ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Couvert
            </>
          ) : isUrgent ? (
            <>
              <Flame className="w-3.5 h-3.5" aria-hidden="true" />
              Urgent
            </>
          ) : (
            <>
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              {filledSlots}/{totalCapacity}
            </>
          )}
        </span>
      )}

      {/* Flèche CTA hover */}
      <span
        className="flex-shrink-0 text-slate-500 group-hover:text-slate-300 transition-colors text-xs"
        aria-hidden="true"
      >
        →
      </span>
    </motion.button>
  );
});

MatchTicker.displayName = 'MatchTicker';

export default MatchTicker;
