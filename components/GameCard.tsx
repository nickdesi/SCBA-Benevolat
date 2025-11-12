import React from 'react';
import type { Game } from '../types';
import VolunteerSlot from './VolunteerSlot';
import GameForm from './GameForm';

interface GameCardProps {
  game: Game;
  onVolunteer: (gameId: string, roleId:string, parentName: string) => void;
  onRemoveVolunteer: (gameId: string, roleId: string, volunteerName: string) => void;
  onUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => void;
  isAdmin: boolean;
  isEditing: boolean;
  onEditRequest: () => void;
  onCancelEdit: () => void;
  onDeleteRequest: () => void;
  onUpdateRequest: (game: Game) => void;
}

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" />
    </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const LocationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const DeleteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);


const GameCard: React.FC<GameCardProps> = ({ game, onVolunteer, onRemoveVolunteer, onUpdateVolunteer, isAdmin, isEditing, onEditRequest, onCancelEdit, onDeleteRequest, onUpdateRequest }) => {
  if (isEditing) {
    return <GameForm gameToEdit={game} onSave={onUpdateRequest} onCancel={onCancelEdit} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
      <div className="bg-slate-800 p-5 relative">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">{game.team}</h3>
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">MATCH</span>
        </div>
        <p className="text-2xl font-black text-slate-100 mt-2">vs {game.opponent}</p>
         {isAdmin && (
            <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={onEditRequest} className="p-2 bg-slate-50 text-slate-700 rounded-full shadow-md hover:bg-slate-200 transition-colors">
                    <EditIcon className="w-5 h-5"/>
                </button>
                <button onClick={onDeleteRequest} className="p-2 bg-slate-50 text-red-600 rounded-full shadow-md hover:bg-slate-200 transition-colors">
                    <DeleteIcon className="w-5 h-5"/>
                </button>
            </div>
        )}
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600 mb-6 border-b pb-6 border-slate-200">
            <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-red-500" />
                <span className="font-semibold">{game.date}</span>
            </div>
            <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-red-500" />
                <span className="font-semibold">{game.time}</span>
            </div>
            <div className="flex items-center gap-2">
                <LocationIcon className="w-5 h-5 text-red-500" />
                <span className="font-semibold">{game.location}</span>
            </div>
        </div>

        <div>
            <h4 className="font-bold text-slate-700 mb-3">Qui peut aider ?</h4>
            <div className="space-y-3">
            {game.roles.map(role => (
                <VolunteerSlot 
                    key={role.id} 
                    role={role}
                    isAdmin={isAdmin} 
                    onVolunteer={(parentName) => onVolunteer(game.id, role.id, parentName)} 
                    onRemoveVolunteer={(volunteerName) => onRemoveVolunteer(game.id, role.id, volunteerName)}
                    onUpdateVolunteer={(oldName, newName) => onUpdateVolunteer(game.id, role.id, oldName, newName)}
                />
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;