import React, { memo } from 'react';
import type { ParsedMatch } from '../../utils/csvImport';
import { formatCompetitionShort } from '../../utils/gameUtils';

interface MatchPreviewCardProps {
  match: ParsedMatch;
  index: number;
  onLocationChange: (index: number, location: string) => void;
}

export const MatchPreviewCard: React.FC<MatchPreviewCardProps> = memo(
  ({ match, index, onLocationChange }) => {
    return (
      <div
        className={`p-3.5 rounded-2xl border transition-all ${
          match.isHome
            ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/40'
            : 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/40'
        }`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                match.isHome ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {match.isHome ? '🏠 Domicile' : '🚗 Extérieur'}
            </span>
            {match.competition && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                {formatCompetitionShort(match.competition) || match.competition}
              </span>
            )}
          </div>

          {match.matchStatus === 'new' && (
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
              ✨ Nouveau match
            </span>
          )}
          {match.matchStatus === 'modified' && (
            <span
              className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800"
              title={match.diffs?.join(', ')}
            >
              🔄 Mise à jour{' '}
              {match.diffs && match.diffs.length > 0 ? `(${match.diffs.join(', ')})` : ''}
            </span>
          )}
          {match.matchStatus === 'unchanged' && (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">
              🔒 Inchangé (Déjà à jour)
            </span>
          )}
        </div>

        {/* Opponents & Logos */}
        <div className="flex items-center gap-2.5 mt-2">
          {match.teamLogo && (
            <img
              src={match.teamLogo}
              alt="Logo SCBA"
              className="w-6 h-6 object-contain rounded-full bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 flex-shrink-0"
            />
          )}
          <span className="font-bold text-xs text-slate-900 dark:text-white font-sport uppercase">
            {match.team}
          </span>
          <span className="text-slate-400 text-xs italic font-bold">vs</span>
          {match.opponentLogo && (
            <img
              src={match.opponentLogo}
              alt="Logo adversaire"
              className="w-6 h-6 object-contain rounded-full bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 flex-shrink-0"
            />
          )}
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-sport truncate">
            {match.opponent}
          </span>
        </div>

        {/* Date, Time, Location */}
        <div className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-medium">
            <span>📅</span>
            <span>
              {match.date} à {match.time}
            </span>
          </div>

          <div className="flex items-start gap-1.5 mt-0.5">
            <span className="mt-0.5">📍</span>
            <input
              type="text"
              value={match.location}
              onChange={(e) => onLocationChange(index, e.target.value)}
              className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              placeholder="Adresse du match"
            />
          </div>
        </div>
      </div>
    );
  },
);

MatchPreviewCard.displayName = 'MatchPreviewCard';
