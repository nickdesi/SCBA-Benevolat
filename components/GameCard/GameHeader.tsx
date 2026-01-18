import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    onDeleteRequest
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <div className={`relative p-4 overflow-hidden ${isHomeGame
            ? 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-green-50 dark:from-emerald-900/50 dark:via-emerald-900/30 dark:to-slate-900'
            : 'bg-gradient-to-br from-blue-100 via-blue-50 to-sky-50 dark:from-blue-900/50 dark:via-blue-900/30 dark:to-slate-900'
            }`}>

            {/* Watermark Icon */}
            <div className={`absolute -right-4 -top-4 text-8xl opacity-10 dark:opacity-[0.12] dark:text-slate-400 select-none pointer-events-none transition-opacity`}>
                {isHomeGame ? '🏠' : '✈️'}
            </div>

            {/* Top Row */}
            <div className="relative flex items-start justify-between gap-2 mb-1 z-10">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight font-sport tracking-wide">{game.team}</h3>
                <div className="flex flex-wrap gap-1.5 items-center flex-shrink-0">
                    <span className={`
                            px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm
                            ${isHomeGame
                            ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                            : 'bg-blue-500 text-white dark:bg-blue-600'
                        }
                        `}>
                        {isHomeGame ? '🏠 Domicile' : '🚗 Extérieur'}
                    </span>

                    {/* SMART CARPOOL BADGE */}
                    {!isHomeGame && (
                        (() => {
                            const remainingSeats = totalCarpoolSeats - totalPassengerRequests;
                            const hasActivity = totalCarpoolSeats > 0 || totalPassengerRequests > 0;

                            if (!hasActivity) return null;

                            // Cas 1 : URGENCE (Plus de demandes que de places)
                            if (remainingSeats < 0) {
                                const deficit = Math.abs(remainingSeats);
                                return (
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-700 animate-pulse">
                                        ⚠️ {deficit} cherch. place
                                    </span>
                                );
                            }

                            // Cas 2 : DISPONIBLE (Places restantes)
                            if (remainingSeats > 0) {
                                return (
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                        🚗 {remainingSeats} place{remainingSeats > 1 ? 's' : ''} dispo
                                    </span>
                                );
                            }

                            // Cas 3 : COMPLET (Juste assez)
                            return (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    ✅ Covoit. complet
                                </span>
                            );
                        })()
                    )}

                    {isFullyStaffed && (
                        <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400 text-white shadow-[0_0_10px_rgba(52,211,153,0.6)] border border-white/30 overflow-hidden"
                        >
                            <motion.span
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut', repeatDelay: 0.5 }}
                            />
                            <span className="relative">✅ Complet</span>
                        </motion.span>
                    )}

                    {isUrgent && !isFullyStaffed && (
                        <motion.span
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-red-100 text-red-600 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800"
                        >
                            🔥 Urgence
                        </motion.span>
                    )}
                </div>
            </div>

            {/* Opponent */}
            <p className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-200 mb-3 font-sport tracking-wide leading-tight line-clamp-2">
                <span className="text-slate-400 dark:text-slate-600 font-medium text-base align-middle mr-2">vs</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500 dark:from-red-400 dark:to-orange-400">{game.opponent}</span>
            </p>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/60 dark:bg-black/30 rounded-lg border border-white/50 dark:border-white/5 backdrop-blur-sm shadow-sm">
                        <CalendarIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">{game.date}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/60 dark:bg-black/30 rounded-lg border border-white/50 dark:border-white/5 backdrop-blur-sm shadow-sm">
                        <ClockIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">{game.time}</span>
                    </span>
                </div>

                <div className="pt-1">
                    <a
                        href={`https://waze.com/ul?q=${encodeURIComponent(game.location)}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-l-4 border-blue-500 hover:border-blue-600 rounded-r-xl transition-all shadow-sm hover:shadow"
                    >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <LocationIcon className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                {game.location}
                            </span>
                        </div>
                        <span className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white dark:bg-slate-700 px-2 py-1 rounded shadow-sm group-hover:translate-x-1 transition-transform">
                            Itinéraire
                        </span>
                    </a>
                </div>
            </div>

            {/* Admin Controls */}
            {isAdmin && (
                <div className="flex gap-2 mt-3 pt-2 border-t border-slate-200/50 w-full justify-end">
                    <button onClick={onEditRequest} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><DeleteIcon className="w-4 h-4" /></button>
                    <ConfirmModal
                        isOpen={showDeleteConfirm}
                        title="Supprimer ce match ?"
                        message={`Voulez-vous vraiment supprimer le match ?`}
                        confirmText="Supprimer"
                        cancelText="Annuler"
                        confirmStyle="danger"
                        onConfirm={() => { setShowDeleteConfirm(false); onDeleteRequest(); }}
                        onCancel={() => setShowDeleteConfirm(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default GameHeader;
