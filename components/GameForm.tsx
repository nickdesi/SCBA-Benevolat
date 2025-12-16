import React, { useState } from 'react';
import type { Game, Role, GameFormData } from '../types';
import { DEFAULT_ROLES, SCBA_TEAMS, COMMON_LOCATIONS, MONTH_MAP } from '../constants';
import { PlusIcon, CheckIcon } from './Icons';

interface GameFormProps {
  gameToEdit?: Game;
  onSave: (game: GameFormData | Game) => void;
  onCancel: () => void;
  existingLocations?: string[];
  existingOpponents?: string[];
}

const GameForm: React.FC<GameFormProps> = ({ gameToEdit, onSave, onCancel, existingLocations = [], existingOpponents = [] }) => {
  const [formData, setFormData] = useState({
    team: gameToEdit?.team || '',
    opponent: gameToEdit?.opponent || '',
    date: gameToEdit?.date || '',
    time: gameToEdit?.time || '',
    location: gameToEdit?.location || 'Maison des Sports',
    isHome: gameToEdit?.isHome ?? true,  // Default to home game
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

  // Helpers for date/time formatting
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDate = e.target.valueAsDate; // Returns Date object (UTC)
    if (!rawDate) return;

    // Formatting to "Samedi 15 Novembre 2025"
    // Use user's local timezone to avoid off-by-one day errors
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    // Create date from input string to avoid timezone shifts (YYYY-MM-DD is local)
    const [y, m, d] = e.target.value.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);

    const formatted = new Intl.DateTimeFormat('fr-FR', options).format(localDate);
    // Capitalize first letter (Samedi) and Month if needed (optional but looks nice)
    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);

    setFormData(prev => ({ ...prev, date: capitalized }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawTime = e.target.value; // "14:30"
    if (!rawTime) return;
    const formatted = rawTime.replace(':', 'H'); // "14H30"
    setFormData(prev => ({ ...prev, time: formatted }));
  };

  // Helper to sync hidden inputs with formatted state
  const getISODate = (formattedDate: string): string => {
    if (!formattedDate) return '';
    try {
      // Expected: "Samedi 15 Novembre 2025"
      const parts = formattedDate.split(' ');
      if (parts.length < 4) return '';

      const day = parts[1];
      const monthName = parts[2].toLowerCase();
      const year = parts[3];

      const monthIndex = MONTH_MAP[monthName as keyof typeof MONTH_MAP];
      if (monthIndex === undefined) return '';

      // Format to YYYY-MM-DD
      const m = (monthIndex + 1).toString().padStart(2, '0');
      const d = day.padStart(2, '0');
      return `${year}-${m}-${d}`;
    } catch (e) {
      return '';
    }
  };

  const getISOTime = (formattedTime: string): string => {
    if (!formattedTime) return '';
    // Expected: "14H30" -> "14:30"
    return formattedTime.replace('H', ':');
  };

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

          {/* TEAM SELECTION */}
          <div className="space-y-1">
            <label htmlFor="team" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span>🏀</span> Équipe
            </label>
            <select
              id="team"
              name="team"
              value={formData.team}
              onChange={(e) => setFormData(prev => ({ ...prev, team: e.target.value }))}
              required
              className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                       bg-white appearance-none"
            >
              <option value="" disabled>Choisir une équipe</option>
              {SCBA_TEAMS.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          {/* OPPONENT */}
          <div className="space-y-1">
            <label htmlFor="opponent" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span>⚔️</span> Adversaire
            </label>
            <input
              type="text"
              id="opponent"
              name="opponent"
              value={formData.opponent}
              onChange={handleChange}
              placeholder="Ex: Royat"
              list="opponents-list"
              required
              className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                       bg-white"
            />
            <datalist id="opponents-list">
              {Array.from(new Set(existingOpponents)).sort().map(opp => (
                <option key={opp} value={opp} />
              ))}
            </datalist>
          </div>

          {/* DATE PICKER */}
          <div className="space-y-1">
            <label htmlFor="date-picker" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span>📅</span> Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="date-picker"
                value={getISODate(formData.date)}
                onChange={handleDateChange}
                onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                onKeyDown={(e) => e.preventDefault()}
                required
                className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                         bg-white cursor-pointer"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>

          {/* TIME PICKER - Simple text input with auto-format */}
          <div className="space-y-1">
            <label htmlFor="time-picker" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span>⏰</span> Heure
            </label>
            <input
              type="text"
              id="time-picker"
              placeholder="--H--"
              value={formData.time}
              onChange={(e) => {
                // Remove non-digits and H
                let digits = e.target.value.replace(/[^0-9]/g, '');
                // Limit to 4 digits
                digits = digits.slice(0, 4);
                // Auto-format: insert H after 2 digits
                let formatted = '';
                if (digits.length <= 2) {
                  formatted = digits;
                } else {
                  formatted = digits.slice(0, 2) + 'H' + digits.slice(2);
                }
                setFormData(prev => ({ ...prev, time: formatted }));
              }}
              required
              className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                       bg-white"
            />
          </div>

          {/* LOCATION - Conditional Input */}
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="location" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span>📍</span> Lieu
            </label>

            {formData.isHome ? (
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                         bg-white appearance-none"
              >
                <option value="Maison des Sports">Maison des Sports</option>
                <option value="Gymnase Fleury">Gymnase Fleury</option>
              </select>
            ) : (
              <>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Ex: Gymnase Ceyrat"
                  list="locations-list"
                  required
                  className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                           bg-white"
                />
                <datalist id="locations-list">
                  {Array.from(new Set([...COMMON_LOCATIONS, ...existingLocations])).sort().map(loc => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </>
            )}
          </div>

        </div>

        {/* Home/Away Toggle - Modern Segmented Control */}
        <div className="pt-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
            <span>📍</span>
            Type de match
          </label>
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setFormData(prev => ({
                ...prev,
                isHome: true,
                location: 'Maison des Sports'
              }))}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${formData.isHome
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30'
                : 'text-slate-600 hover:bg-white/50'
                }`}
            >
              <span className="text-lg">🏠</span>
              Domicile
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({
                ...prev,
                isHome: false,
                location: '' // Always clear when switching to Away to prompt manual entry
              }))}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${!formData.isHome
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-600 hover:bg-white/50'
                }`}
            >
              <span className="text-lg">🚗</span>
              Extérieur
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>💡</span>
            {formData.isHome
              ? 'Match à domicile : Bénévolat (Buvette, Chrono, Table, Goûter)'
              : 'Match à l\'extérieur : Covoiturage uniquement'}
          </p>
        </div>

        {/* Role Capacities Section - Only for editing existing HOME games */}
        {gameToEdit && formData.isHome && (
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
