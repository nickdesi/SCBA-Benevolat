import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Plane, Car, Flame, AlertTriangle, CheckIcon, Trophy } from 'lucide-react';
import type { Game } from '../../types';
import ConfirmModal from '../ConfirmModal';
import { CalendarIcon, ClockIcon, LocationIcon, EditIcon, DeleteIcon } from '../Icons';

interface GameHeaderProps {
  game: Game;
  isHomeGame: boolean;
  isFullyStaffed: boolean;
  totalCarpoolSeats: number;
  totalPassengerRequests: number;
  isUrgent: boolean;
  isAdmin: boolean;
  onEditRequest: () => void;
  onDeleteRequest: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  game,
  isHomeGame,
  isFullyStaffed,
  totalCarpoolSeats,
  totalPassengerRequests,
  isUrgent,
  isAdmin,
  onEditRequest,
  onDeleteRequest,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div
      className={`relative p-5 overflow-hidden transition-colors duration-300 ${
        game.competition
          ? 'bg-gradient-to-br from-amber-200/80 via-yellow-100/50 to-white/80 dark:from-amber-900/40 dark:via-amber-950/20 dark:to-slate-900'
          : isHomeGame
            ? 'bg-gradient-to-br from-emerald-200/80 via-emerald-100/60 to-white/80 dark:from-emerald-900/60 dark:via-emerald-900/20 dark:to-slate-900'
            : 'bg-gradient-to-br from-blue-200/80 via-blue-100/60 to-white/80 dark:from-blue-900/60 dark:via-blue-900/20 dark:to-slate-900'
      }`}
    >
      {/* Watermark Icon - Subtle & Elegant */}
      <div
        className={`absolute -right-6 -top-6 pointer-events-none transform rotate-12 scale-150 transition-opacity duration-300 ${
          game.competition
            ? 'text-amber-500/15 dark:text-amber-400/10'
            : isHomeGame
              ? 'text-emerald-500/20 dark:text-emerald-400/10'
              : 'text-blue-500/20 dark:text-blue-400/10'
        }`}
      >
        {game.competition ? (
          <Trophy className="w-48 h-48" />
        ) : isHomeGame ? (
          <Home className="w-48 h-48" />
        ) : (
          <Plane className="w-48 h-48" />
        )}
      </div>

      {/* Top Row: Status only (Date moved to info) */}
      <div
        className={`relative flex items-center justify-between mb-2 z-10 ${isAdmin ? 'pr-16' : ''}`}
      >
        {game.competition ? (
          <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-full shadow-sm bg-gradient-to-r from-amber-500 to-yellow-500 text-white animate-pulse">
            <Trophy className="w-3.5 h-3.5 text-yellow-100" />
            {game.competition}
          </div>
        ) : (
          <div />
        )}
        <div className="flex flex-col items-end gap-1.5">
          {/* Urgency / Status Pills */}
          <div className="flex items-center gap-1.5">
            {isUrgent && !isFullyStaffed && (
              <motion.span
                animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50 shadow-sm"
              >
                <Flame className="w-3 h-3 inline mr-1 mb-0.5" />
                Urgence
              </motion.span>
            )}

            <span
              className={`
                            flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-sm
                            ${isHomeGame ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}
                        `}
            >
              {isHomeGame ? (
                <Home className="w-3 h-3 text-emerald-100" />
              ) : (
                <Car className="w-3 h-3 text-blue-100" />
              )}
              {isHomeGame ? 'Domicile' : 'Extérieur'}
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Teams & Versus */}
      <div className="relative z-10 mb-4 ">
        <div className="flex items-center gap-2.5 mb-1">
          {game.teamLogo && (
            <img
              src={game.teamLogo}
              alt={game.team}
              className="w-7 h-7 object-contain rounded-full bg-white/80 dark:bg-slate-800/80 p-0.5 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0"
            />
          )}
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-sport">
            {game.team}
          </h3>
          <span className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></span>
        </div>

        <div className="group relative flex items-start gap-2.5">
          <span className="text-slate-300 dark:text-slate-600 text-lg italic mt-1.5 flex-shrink-0">
            VS
          </span>
          {game.opponentLogo && (
            <img
              src={game.opponentLogo}
              alt={game.opponent}
              className="w-9 h-9 object-contain rounded-full bg-white/85 dark:bg-slate-800/85 p-0.5 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0 mt-0.5"
            />
          )}
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight font-sport tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
            {game.opponent}
          </h2>
        </div>
      </div>

      {/* Bottom: Info Pills Layout (Refined) */}
      <div className="relative z-10 flex flex-col gap-2.5">
        {/* Row 1: Date & Time */}
        <div className="flex items-stretch gap-2">
          {/* Date Pill */}
          <div className="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-slate-700/50">
            <div className="flex-shrink-0 p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-lg">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {game.date}
            </span>
          </div>

          {/* Time Pill */}
          <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-slate-700/50 min-w-max">
            <div className="flex-shrink-0 p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-lg">
              <ClockIcon className="w-4 h-4" />
            </div>
            <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {game.time}
            </span>
          </div>
        </div>

        {/* Row 2: Location (Full Width) */}
        <a
          href={`https://waze.com/ul?q=${encodeURIComponent(game.location)}&navigate=yes`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/50 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-slate-700/50 group transition-all transform hover:-translate-y-0.5 active:scale-95"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
              <LocationIcon className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate pr-2">
              {game.location}
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm transition-all flex-shrink-0">
            Itinéraire
          </span>
        </a>
      </div>

      {/* Smart Carpool Status Line */}
      {!isHomeGame && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap gap-2">
          {(() => {
            const remainingSeats = totalCarpoolSeats - totalPassengerRequests;
            const hasActivity = totalCarpoolSeats > 0 || totalPassengerRequests > 0;

            if (!hasActivity)
              return (
                <span className="text-xs text-slate-400 italic flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" /> Covoiturage non organisé
                </span>
              );

            if (remainingSeats < 0) {
              return (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" /> Manque {Math.abs(remainingSeats)}{' '}
                  place(s)
                </span>
              );
            }
            if (remainingSeats > 0) {
              return (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" /> {remainingSeats} place(s) dispo
                </span>
              );
            }
            return (
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckIcon className="w-3.5 h-3.5" /> Covoit. complet
              </span>
            );
          })()}
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 z-50">
          <button
            onClick={onEditRequest}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:bg-blue-100"
          >
            <EditIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:bg-red-100"
          >
            <DeleteIcon className="w-4 h-4" />
          </button>
          <ConfirmModal
            isOpen={showDeleteConfirm}
            title="Supprimer ce match ?"
            message={`Voulez-vous vraiment supprimer le match ?`}
            confirmText="Supprimer"
            cancelText="Annuler"
            confirmStyle="danger"
            onConfirm={() => {
              setShowDeleteConfirm(false);
              onDeleteRequest();
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default GameHeader;
