import React, { memo } from 'react';
import type { Game, CarpoolEntry } from '../types';
import VolunteerSlot from './VolunteerSlot';
import GameForm from './GameForm';
import CarpoolingSection from './CarpoolingSection';
import { CalendarIcon, ClockIcon, LocationIcon, EditIcon, DeleteIcon } from './Icons';
import { downloadGameCalendar } from '../utils/calendar';

interface GameCardProps {
    game: Game;
    onVolunteer: (gameId: string, roleId: string, parentName: string) => void;
    onRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => void;
    onUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => void;
    onAddCarpool: (gameId: string, entry: Omit<CarpoolEntry, 'id'>) => void;
    onRemoveCarpool: (gameId: string, entryId: string) => void;
    onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
    isAdmin: boolean;
    isEditing: boolean;
    onEditRequest: () => void;
    onCancelEdit: () => void;
    onDeleteRequest: () => void;
    onUpdateRequest: (game: Game) => void;
}

// Check if a role is considered "complete"
// For unlimited roles (Infinity or 0), require at least 2 volunteers
const isRoleComplete = (role: { capacity: number; volunteers: string[] }): boolean => {
    const isUnlimited = role.capacity === Infinity || role.capacity === 0;
    if (isUnlimited) {
        return role.volunteers.length >= 2;
    }
    return role.volunteers.length >= role.capacity;
};

// Check if all roles in a game are complete
const isGameFullyStaffed = (game: Game): boolean => {
    return game.roles.every(isRoleComplete);
};

const GameCard: React.FC<GameCardProps> = memo(({
    game,
    onVolunteer,
    onRemoveVolunteer,
    onUpdateVolunteer,
    onAddCarpool,
    onRemoveCarpool,
    onToast,
    isAdmin,
    isEditing,
    onEditRequest,
    onCancelEdit,
    onDeleteRequest,
    onUpdateRequest
}) => {
    if (isEditing) {
        return <GameForm gameToEdit={game} onSave={onUpdateRequest} onCancel={onCancelEdit} />;
    }

    const isFullyStaffed = isGameFullyStaffed(game);

    // Default to home game if isHome is not defined (legacy matches)
    const isHomeGame = game.isHome ?? true;

    const handleAddToCalendar = () => {
        const success = downloadGameCalendar(game);
        if (success && onToast) {
            onToast('📅 Événement ajouté à votre calendrier !', 'success');
        } else if (!success && onToast) {
            onToast('Erreur lors de la création du fichier calendrier', 'error');
        }
    };

    return (
        <div className={`
      relative overflow-hidden rounded-2xl shadow-xl transition-all duration-500 h-full flex flex-col
      ${isFullyStaffed
                ? 'ring-4 ring-emerald-400 ring-offset-2 shadow-emerald-200'
                : 'border border-slate-200 hover:shadow-2xl hover:border-red-200 hover:-translate-y-1'
            }
    `}>
            {/* Celebration Animation Overlay */}
            {isFullyStaffed && (
                <>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent 
                        animate-[shimmer_3s_infinite] pointer-events-none z-10"></div>

                    {/* Confetti decorations */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400"></div>
                </>
            )}

            <div className="bg-white flex-1 flex flex-col">
                {/* Card Header */}
                <div className={`
          relative p-5 sm:p-6 transition-all duration-500
          ${isFullyStaffed
                        ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700'
                        : 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950'
                    }
        `}>
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: isFullyStaffed
                                ? `radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
                   radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)`
                                : `radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.3) 0%, transparent 50%),
                   radial-gradient(circle at 80% 20%, rgba(251, 146, 60, 0.3) 0%, transparent 50%)`
                        }}></div>
                    </div>

                    <div className="relative z-10">
                        {/* Team and Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <h3 className="text-lg sm:text-xl font-bold text-white">{game.team}</h3>
                            <div className="flex flex-wrap gap-2 items-center">
                                {/* Home/Away Badge */}
                                <span className={`
                                    px-3 py-1 text-white text-xs font-bold uppercase tracking-wider rounded-full
                                    ${isHomeGame
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/30'
                                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/30'
                                    } shadow-lg
                                `}>
                                    {isHomeGame ? '🏠 DOMICILE' : '🚗 EXTÉRIEUR'}
                                </span>
                                {/* Status Badge */}
                                <span className={`
                                    px-3 py-1 text-white text-xs font-bold uppercase tracking-wider rounded-full
                                    shadow-lg animate-pulse
                                    ${isFullyStaffed
                                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 shadow-yellow-400/30'
                                        : 'bg-gradient-to-r from-red-500 to-orange-500 shadow-red-500/30'
                                    }
                                `}>
                                    {isFullyStaffed ? '✅ COMPLET' : '🏀 MATCH'}
                                </span>
                                {/* Admin Controls - Inline with badges */}
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={onEditRequest}
                                            className="flex items-center gap-1.5 px-3 py-1 
                                                     bg-blue-500 hover:bg-blue-600 
                                                     text-white text-xs font-medium rounded-full
                                                     transition-all duration-200 hover:scale-105 shadow-lg"
                                            aria-label="Modifier le match"
                                        >
                                            <EditIcon className="w-3.5 h-3.5" />
                                            <span>Modifier</span>
                                        </button>
                                        <button
                                            onClick={onDeleteRequest}
                                            className="flex items-center gap-1.5 px-3 py-1 
                                                     bg-red-500 hover:bg-red-600 
                                                     text-white text-xs font-medium rounded-full
                                                     transition-all duration-200 hover:scale-105 shadow-lg"
                                            aria-label="Supprimer le match"
                                        >
                                            <DeleteIcon className="w-3.5 h-3.5" />
                                            <span>Supprimer</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* VS Opponent */}
                        <p className="text-2xl sm:text-3xl font-black text-white">
                            vs <span className={`bg-clip-text text-transparent ${isFullyStaffed
                                ? 'bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400'
                                : 'bg-gradient-to-r from-red-400 via-orange-400 to-amber-400'
                                }`}>{game.opponent}</span>
                        </p>
                    </div>
                </div>

                {/* Fully Staffed Banner */}
                {isFullyStaffed && (
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-200 
                        py-3 px-5 flex items-center justify-center gap-3 animate-pulse">
                        <span className="text-2xl">🎉</span>
                        <span className="font-bold text-emerald-700">Équipe complète ! Merci à tous les bénévoles !</span>
                        <span className="text-2xl">🎉</span>
                    </div>
                )}

                {/* Card Body */}
                <div className="p-5 sm:p-6">
                    {/* Info Grid - Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <CalendarIcon className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Date</p>
                                <p className="font-bold text-slate-800 text-sm">{game.date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <ClockIcon className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Heure</p>
                                <p className="font-bold text-slate-800 text-sm">{game.time}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <LocationIcon className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Lieu</p>
                                <p className="font-bold text-slate-800 text-sm">{game.location}</p>
                            </div>
                        </div>
                    </div>

                    {/* Add to Calendar Button */}
                    <button
                        onClick={handleAddToCalendar}
                        className="group w-full mb-6 py-3 px-4 flex items-center justify-center gap-2 
                            bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
                            hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600
                            text-white font-bold rounded-2xl shadow-lg hover:shadow-xl
                            transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]
                            border border-white/20"
                    >
                        <span className="text-lg">📅</span>
                        <span>Ajouter à mon calendrier</span>
                    </button>

                    {/* Volunteer Section - Only for HOME games */}
                    {isHomeGame && (
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-xl ${isFullyStaffed
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                                    : 'bg-gradient-to-br from-red-500 to-orange-500'
                                    }`}>
                                    <span className="text-xl">{isFullyStaffed ? '🏆' : '🙋'}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">
                                        {isFullyStaffed ? 'Tous les postes sont pourvus !' : 'Qui peut aider ?'}
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                        {isFullyStaffed ? 'Merci pour votre engagement' : 'Inscrivez-vous pour un poste'}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {game.roles.map((role, index) => (
                                    <VolunteerSlot
                                        key={role.id}
                                        role={role}
                                        gameId={game.id}
                                        isAdmin={isAdmin}
                                        onVolunteer={(parentName) => {
                                            onVolunteer(game.id, role.id, parentName);
                                            if (onToast) onToast('Inscription confirmée !', 'success');
                                        }}
                                        onRemoveVolunteer={(volunteerName) => onRemoveVolunteer(game.id, role.id, volunteerName)}
                                        onUpdateVolunteer={(oldName, newName) => onUpdateVolunteer(game.id, role.id, oldName, newName)}
                                        animationDelay={index * 0.1}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Carpooling Section - Only for AWAY games */}
                    {!isHomeGame && (
                        <CarpoolingSection
                            gameId={game.id}
                            entries={game.carpool || []}
                            isAdmin={isAdmin}
                            onAddEntry={(entry) => {
                                onAddCarpool(game.id, entry);
                                if (onToast) onToast('🚗 Inscription covoiturage confirmée !', 'success');
                            }}
                            onRemoveEntry={(entryId) => onRemoveCarpool(game.id, entryId)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
});

GameCard.displayName = 'GameCard';

export default GameCard;