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
            <div className={`absolute -right-4 -top-4 text-8xl opacity-10 dark:opacity-5 select-none pointer-events-none`}>
                {isHomeGame ? '🏟️' : '🚌'}
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

                    {!isHomeGame && totalCarpoolSeats > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-emerald-50 text-emerald-700">
                            🚗 {totalCarpoolSeats}
                        </span>
                    )}

                    {isFullyStaffed && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-emerald-100 text-emerald-800">
                            ✓ Complet
                        </span>
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
            <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 font-sport tracking-wide">
                vs <span className="text-red-600 dark:text-red-400">{game.opponent}</span>
            </p>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md backdrop-blur-sm">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{game.date}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md backdrop-blur-sm">
                        <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{game.time}</span>
                    </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <LocationIcon className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                        <a
                            href={`https://waze.com/ul?q=${encodeURIComponent(game.location)}&navigate=yes`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            {game.location}
                        </a>
                    </div>
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
