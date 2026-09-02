import React, { useState } from 'react';
import { Home, Plane, Flame, Trophy, BadgeCheck, Navigation, Calendar } from 'lucide-react';
import type { Game } from '../../types';
import ConfirmModal from '../ConfirmModal';
import { EditIcon, DeleteIcon } from '../Icons';
import { formatRank, isCupCompetition } from '../../utils/gameUtils';
import { formatDateShort } from '../../utils/dateUtils';

interface GameHeaderProps {
  game: Game;
  isHomeGame: boolean;
  isFullyStaffed: boolean;
  filledSlots?: number;
  totalCapacity?: number;
  totalCarpoolSeats: number;
  totalPassengerRequests: number;
  isUrgent: boolean;
  isAdmin: boolean;
  isUserRegistered?: boolean;
  onEditRequest: () => void;
  onDeleteRequest: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  game,
  isHomeGame,
  isFullyStaffed,
  filledSlots = 0,
  totalCapacity = 0,
  totalCarpoolSeats: _totalCarpoolSeats,
  totalPassengerRequests: _totalPassengerRequests,
  isUrgent,
  isAdmin,
  isUserRegistered = false,
  onEditRequest,
  onDeleteRequest,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isCup = isCupCompetition(game.competition);
  const isChampionship = !isCup;
  const formattedTeamRank = isChampionship ? formatRank(game.teamRank) : null;
  const formattedOpponentRank = isChampionship ? formatRank(game.opponentRank) : null;

  const scbaTeamName = game.team;
  const opponentName = game.opponent;

  // Calcul pour la jauge circulaire
  const progressPercent =
    totalCapacity > 0 ? Math.min(100, Math.round((filledSlots / totalCapacity) * 100)) : 0;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      className={`relative p-4 sm:p-5 overflow-hidden transition-colors duration-300 ${
        isCup
          ? 'bg-gradient-to-br from-amber-200/90 via-amber-100/70 to-amber-50/60 dark:from-amber-950/80 dark:via-amber-900/40 dark:to-slate-900'
          : isHomeGame
            ? 'bg-gradient-to-br from-emerald-200/90 via-emerald-100/70 to-emerald-50/60 dark:from-emerald-950/80 dark:via-emerald-900/40 dark:to-slate-900'
            : 'bg-gradient-to-br from-blue-200/90 via-blue-100/70 to-blue-50/60 dark:from-blue-950/80 dark:via-blue-900/40 dark:to-slate-900'
      }`}
    >
      {/* Signature Watermark Icon - Subtle & Elegant (Plane for away, Home for home, Trophy for cup) */}
      <div
        className={`absolute -right-8 -top-8 pointer-events-none transform rotate-12 transition-opacity duration-300 ${
          isCup
            ? 'text-amber-500/25 dark:text-amber-400/20'
            : isHomeGame
              ? 'text-emerald-600/25 dark:text-emerald-400/20'
              : 'text-blue-600/25 dark:text-blue-400/20'
        }`}
      >
        {isCup ? (
          <Trophy className="w-52 h-52" />
        ) : isHomeGame ? (
          <Home className="w-52 h-52" />
        ) : (
          <Plane className="w-52 h-52" />
        )}
      </div>

      {/* Top Meta Bar: Badges + Jauge Bénévoles + Admin Controls */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3 min-h-[30px]">
        {/* Left: Competition Badge */}
        <div className="min-w-0 flex-1 flex items-center gap-1.5">
          {isCup ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 truncate shadow-xs">
              <Trophy className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="truncate">{game.competition}</span>
            </span>
          ) : game.competition ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-white/80 dark:border-slate-700/80 backdrop-blur-xs truncate shadow-2xs">
              {game.competition}
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Match officiel
            </span>
          )}
        </div>

        {/* Right: Urgent + My Registration + Home/Away Pills + Circular Gauge + Admin Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center gap-0.5 mr-0.5 bg-white/80 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <button
                type="button"
                onClick={onEditRequest}
                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors"
                aria-label="Modifier ce match"
              >
                <EditIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors"
                aria-label="Supprimer ce match"
              >
                <DeleteIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mon engagement */}
          {isUserRegistered && isHomeGame && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-[#3629e1] text-white shadow-xs"
              title="Vous êtes bénévole sur ce match"
            >
              <BadgeCheck className="w-3 h-3" />
              Inscrit
            </span>
          )}

          {/* Urgent Badge */}
          {isUrgent && !isFullyStaffed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-red-500 text-white shadow-xs animate-pulse">
              <Flame className="w-3 h-3" />
              Urgent
            </span>
          )}

          {/* Domicile / Extérieur Pill */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full text-white shadow-xs ${
              isHomeGame ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
          >
            {isHomeGame ? (
              <>
                <Home className="w-3 h-3 text-emerald-200" />
                Domicile
              </>
            ) : (
              <>
                <Plane className="w-3 h-3 text-blue-200" />
                Extérieur
              </>
            )}
          </span>

          {/* Circular Volunteer Progress Gauge for Home games */}
          {isHomeGame && totalCapacity > 0 && (
            <div
              className="relative w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-slate-800/90 rounded-full shadow-2xs border border-white/90 dark:border-slate-700/80 backdrop-blur-sm"
              title={`Bénévoles : ${filledSlots}/${totalCapacity} (${progressPercent}%)`}
            >
              <svg className="w-7 h-7 transform -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r={radius}
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="2.5"
                  fill="transparent"
                />
                <circle
                  cx="16"
                  cy="16"
                  r={radius}
                  className={
                    isFullyStaffed
                      ? 'stroke-emerald-500 transition-all duration-500'
                      : isUrgent
                        ? 'stroke-red-500 transition-all duration-500'
                        : 'stroke-emerald-600 dark:stroke-emerald-400 transition-all duration-500'
                  }
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-[9px] font-black font-sport text-slate-800 dark:text-slate-100">
                {filledSlots}/{totalCapacity}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Face-Off Section (Scoreboard / Versus Style) */}
      <div className="relative z-10 py-1.5 px-0.5">
        <div className="grid grid-cols-11 items-center gap-2">
          {/* Team 1: SCBA (or Host) */}
          <div className="col-span-4 flex flex-col items-center text-center min-w-0">
            <div className="relative mb-2">
              <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-white shadow-sm border border-slate-200/90 dark:border-white/25 flex items-center justify-center overflow-hidden p-0">
                {game.teamLogo ? (
                  <img
                    src={game.teamLogo}
                    alt={scbaTeamName}
                    className="w-full h-full object-contain transform scale-135"
                    loading="lazy"
                  />
                ) : (
                  <span className="font-sport font-black text-lg text-[#3629e1]">SCBA</span>
                )}
              </div>
              {formattedTeamRank && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-md bg-amber-500 text-white font-black text-[9px] shadow-xs">
                  {formattedTeamRank}
                </span>
              )}
            </div>
            <div className="h-10 sm:h-11 flex items-center justify-center px-1">
              <h2 className="font-sport font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase leading-tight tracking-tight line-clamp-2">
                {scbaTeamName}
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              {isHomeGame ? 'Hôte' : 'Visiteur'}
            </span>
          </div>

          {/* Center: Match Time / Date Pill */}
          <div className="col-span-3 flex flex-col items-center justify-center text-center">
            <div className="flex flex-col items-center justify-center px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs w-full max-w-[96px]">
              <span className="font-sport font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none">
                {game.time}
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
                {formatDateShort(game.dateISO, game.date)}
              </span>
            </div>
            <span className="font-sport text-[10px] font-black text-slate-300 dark:text-slate-600 mt-1 uppercase tracking-widest">
              VS
            </span>
          </div>

          {/* Team 2: Opponent */}
          <div className="col-span-4 flex flex-col items-center text-center min-w-0">
            <div className="relative mb-2">
              <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-white shadow-sm border border-slate-200/90 dark:border-white/25 flex items-center justify-center overflow-hidden p-0">
                {game.opponentLogo ? (
                  <img
                    src={game.opponentLogo}
                    alt={opponentName}
                    className="w-full h-full object-contain transform scale-135"
                    loading="lazy"
                  />
                ) : (
                  <span className="font-sport font-black text-base text-slate-700 uppercase">
                    {opponentName.substring(0, 3)}
                  </span>
                )}
              </div>
              {formattedOpponentRank && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-md bg-slate-600 text-white font-black text-[9px] shadow-xs">
                  {formattedOpponentRank}
                </span>
              )}
            </div>
            <div className="h-10 sm:h-11 flex items-center justify-center px-1">
              <h3 className="font-sport font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 uppercase leading-tight tracking-tight line-clamp-2">
                {opponentName}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              {!isHomeGame ? 'Hôte' : 'Visiteur'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Info Strip: Location & Direct GPS (Glass Capsule) */}
      <div className="relative z-10 mt-3 px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/80 dark:border-slate-700/60 shadow-2xs flex items-center justify-between gap-2">
        {/* Short Date & Location Line */}
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 min-w-0 flex-1">
          <Calendar className="w-3.5 h-3.5 text-[#3629e1] dark:text-indigo-400 flex-shrink-0" />
          <span className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
            {formatDateShort(game.dateISO, game.date)}
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="truncate text-slate-600 dark:text-slate-400 font-medium">
            {game.location}
          </span>
        </div>

        {/* Waze / GPS Quick Action */}
        <a
          href={`https://waze.com/ul?q=${encodeURIComponent(game.location)}&navigate=yes`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#3629e1] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 rounded-md border border-indigo-100 dark:border-indigo-900/60 transition-colors flex-shrink-0"
        >
          <Navigation className="w-3 h-3" />
          Itinéraire
        </a>
      </div>

      {/* Admin Confirm Modal */}
      {isAdmin && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Supprimer ce match ?"
          message="Voulez-vous vraiment supprimer ce match ?"
          confirmText="Supprimer"
          cancelText="Annuler"
          confirmStyle="danger"
          onConfirm={() => {
            setShowDeleteConfirm(false);
            onDeleteRequest();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

export default GameHeader;
