import React, { useState } from 'react';
import type { Game, Role } from '../types';
import { PlusIcon, CheckIcon } from './Icons';

interface GameFormProps {
  gameToEdit?: Game;
  onSave: (game: Omit<Game, 'id' | 'roles'> | Game) => void;
  onCancel: () => void;
}

// Default roles configuration
const DEFAULT_ROLES = [
  { name: 'Buvette', capacity: 2, icon: '🍺' },
  { name: 'Chrono', capacity: 1, icon: '⏱️' },
  { name: 'Table de marque', capacity: 1, icon: '📋' },
  { name: 'Goûter', capacity: 0, icon: '🍪' }, // 0 = unlimited
];

const GameForm: React.FC<GameFormProps> = ({ gameToEdit, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    team: gameToEdit?.team || '',
    opponent: gameToEdit?.opponent || '',
    date: gameToEdit?.date || '',
    time: gameToEdit?.time || '',
    location: gameToEdit?.location || '',
  });

  // Initialize role capacities from existing game or defaults
  const [roleCapacities, setRoleCapacities] = useState<Record<string, number>>(() => {
    if (gameToEdit?.roles) {
      const caps: Record<string, number> = {};
      gameToEdit.roles.forEach(role => {
        caps[role.name] = role.capacity === Infinity ? 0 : role.capacity;
      });
      return caps;
    }
    return DEFAULT_ROLES.reduce((acc, role) => {
      acc[role.name] = role.capacity;
      return acc;
    }, {} as Record<string, number>);
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCapacityChange = (roleName: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setRoleCapacities(prev => ({ ...prev, [roleName]: Math.max(0, numValue) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameToEdit) {
      // Update existing game with new capacities
      const updatedRoles: Role[] = gameToEdit.roles.map(role => ({
        ...role,
        capacity: roleCapacities[role.name] === 0 ? Infinity : roleCapacities[role.name],
      }));
      onSave({ ...gameToEdit, ...formData, roles: updatedRoles });
    } else {
      onSave(formData);
    }
  };

  const formFields = [
    { name: 'team', label: 'Équipe', placeholder: 'Ex: U11 - Équipe 1', icon: '🏀' },
    { name: 'opponent', label: 'Adversaire', placeholder: 'Ex: Royat', icon: '⚔️' },
    { name: 'date', label: 'Date', placeholder: 'Ex: Samedi 15 Novembre', icon: '📅' },
    { name: 'time', label: 'Heure', placeholder: 'Ex: 11H00', icon: '⏰' },
    { name: 'location', label: 'Lieu', placeholder: 'Ex: Maison des Sports', icon: '📍' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 animate-fade-in-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
            {gameToEdit ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            ) : (
              <PlusIcon className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {gameToEdit ? 'Modifier le match' : 'Ajouter un nouveau match'}
            </h3>
            <p className="text-slate-500 text-sm">Renseignez les informations du match</p>
          </div>
        </div>

        {/* Match Info Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formFields.map(field => (
            <div key={field.name} className="space-y-1">
              <label htmlFor={field.name} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span>{field.icon}</span>
                {field.label}
              </label>
              <input
                type="text"
                id={field.name}
                name={field.name}
                value={formData[field.name as keyof typeof formData]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
                className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                         bg-white"
              />
            </div>
          ))}
        </div>

        {/* Role Capacities Section - Only for editing existing games */}
        {gameToEdit && (
          <div className="pt-4 border-t border-slate-200">
            <h4 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
              <span className="text-xl">👥</span>
              Nombre de bénévoles par poste
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DEFAULT_ROLES.map(role => (
                <div key={role.name} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <span>{role.icon}</span>
                    {role.name}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={roleCapacities[role.name] || 0}
                      onChange={(e) => handleCapacityChange(role.name, e.target.value)}
                      className="w-full px-3 py-2 text-center text-base font-bold border-2 border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-center">
                    {roleCapacities[role.name] === 0 ? '∞ illimité' : `max ${roleCapacities[role.name]}`}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <span>💡</span>
              Mettez 0 pour un nombre illimité de bénévoles
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-base font-semibold text-slate-700 bg-slate-100 rounded-xl 
                     hover:bg-slate-200 transition-colors order-2 sm:order-1"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-6 py-3 text-base font-bold text-white rounded-xl 
                     bg-gradient-to-r from-red-500 to-orange-500 
                     hover:from-red-600 hover:to-orange-600 
                     shadow-lg shadow-red-500/30 hover:shadow-red-500/50
                     transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            <CheckIcon className="w-5 h-5" />
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};

export default GameForm;
