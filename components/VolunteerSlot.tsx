import React, { useState } from 'react';
import type { Role } from '../types';

interface VolunteerSlotProps {
  role: Role;
  onVolunteer: (parentName: string) => void;
  onRemoveVolunteer: (parentName: string) => void;
  onUpdateVolunteer: (oldName: string, newName: string) => void;
  isAdmin: boolean;
}

const RemoveUserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" />
    </svg>
);

const EditPencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
);


const VolunteerSlot: React.FC<VolunteerSlotProps> = ({ role, onVolunteer, onRemoveVolunteer, onUpdateVolunteer, isAdmin }) => {
  const [newName, setNewName] = useState('');
  const [editingVolunteer, setEditingVolunteer] = useState<string | null>(null);
  const canSignUp = role.volunteers.length < role.capacity;

  const handleSignUp = () => {
    if (newName.trim() && canSignUp) {
      onVolunteer(newName.trim());
      setNewName('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        if (editingVolunteer) {
            handleUpdate();
        } else {
            handleSignUp();
        }
    }
  };

  const startEditing = (name: string) => {
    setEditingVolunteer(name);
    setNewName(name);
  };
  
  const cancelEditing = () => {
    setEditingVolunteer(null);
    setNewName('');
  };

  const handleUpdate = () => {
    if (newName.trim() && editingVolunteer) {
      onUpdateVolunteer(editingVolunteer, newName.trim());
      cancelEditing();
    }
  };

  const capacityText =
    role.capacity === Infinity
      ? `${role.volunteers.length} bénévole(s)`
      : `${role.volunteers.length} / ${role.capacity}`;

  return (
    <div className="bg-slate-50 p-3 rounded-lg flex flex-col gap-3">
        <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-800">{role.name}</span>
            <span className="text-sm font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                {capacityText}
            </span>
        </div>
        <div className="w-full space-y-2">
            {role.volunteers.map(volunteer => (
                editingVolunteer === volunteer ? (
                    <div key={volunteer} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-grow w-full px-3 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            autoFocus
                        />
                         <button onClick={cancelEditing} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-200 rounded-md hover:bg-slate-300">X</button>
                        <button onClick={handleUpdate} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">OK</button>
                    </div>
                ) : (
                    <div key={volunteer} className="flex items-center justify-between gap-2 bg-green-100 text-green-800 p-2 rounded-md">
                        <span className="font-medium">{volunteer}</span>
                        <div className="flex items-center gap-2">
                            {isAdmin ? (
                                <button 
                                    onClick={() => onRemoveVolunteer(volunteer)} 
                                    className="text-red-600 hover:text-red-800 focus:outline-none"
                                    aria-label={`Supprimer ${volunteer}`}
                                >
                                    <RemoveUserIcon className="w-5 h-5" />
                                </button>
                            ) : (
                                <button 
                                    onClick={() => startEditing(volunteer)} 
                                    className="text-slate-500 hover:text-slate-700 focus:outline-none"
                                    aria-label={`Modifier ${volunteer}`}
                                >
                                    <EditPencilIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )
            ))}

            {canSignUp && !editingVolunteer && (
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Votre nom..."
                    className="flex-grow w-full px-3 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                    onClick={handleSignUp}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                    OK
                </button>
            </div>
            )}
            {!canSignUp && role.capacity !== Infinity && (
                 <div className="text-center text-sm text-green-700 font-semibold p-2">Complet ! Merci !</div>
            )}
        </div>
    </div>
  );
};

export default VolunteerSlot;