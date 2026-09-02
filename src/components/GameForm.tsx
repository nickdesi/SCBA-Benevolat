import React, { useState, useMemo } from 'react';
import type { Game, Role, GameFormData } from '../types';
import { DEFAULT_ROLES, SCBA_TEAMS, COMMON_LOCATIONS, MONTH_MAP } from '../constants';
import { PlusIcon, CheckIcon } from './Icons';
import { CustomSelect } from './ui/CustomSelect';

interface GameFormProps {
  gameToEdit?: Game;
  onSave: (game: GameFormData | Game) => void;
  onCancel: () => void;
  existingLocations?: string[];
  existingOpponents?: string[];
}

const GameForm: React.FC<GameFormProps> = ({
  gameToEdit,
  onSave,
  onCancel,
  existingLocations = [],
  existingOpponents = [],
}) => {
  // ⚡ Bolt Optimization: Memoize sorted datalist options to prevent O(N log N) sorting
  // and redundant array allocations on every keystroke in this controlled form.
  const uniqueOpponents = useMemo(() => {
    return Array.from(new Set(existingOpponents)).sort();
  }, [existingOpponents]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set([...COMMON_LOCATIONS, ...existingLocations])).sort();
  }, [existingLocations]);

  const [formData, setFormData] = useState({
    team: gameToEdit?.team || '',
    opponent: gameToEdit?.opponent || '',
    date: gameToEdit?.date || '',
    dateISO: gameToEdit?.dateISO || '', // ISO format for reliable sorting
    time: gameToEdit?.time || '',
    location: gameToEdit?.location || 'Maison des Sports',
    isHome: gameToEdit?.isHome ?? true,
    competition: gameToEdit?.competition || '',
    teamRank: gameToEdit?.teamRank ?? '',
    opponentRank: gameToEdit?.opponentRank ?? '',
  });

  // Initialize role capacities from existing game or defaults
  const [roleCapacities, setRoleCapacities] = useState<Record<string, number>>(() => {
    if (gameToEdit?.roles) {
      const caps: Record<string, number> = {};
      gameToEdit.roles.forEach((role) => {
        caps[role.name] = role.capacity === Infinity ? 0 : role.capacity;
      });
      return caps;
    }
    return DEFAULT_ROLES.reduce(
      (acc, role) => {
        acc[role.name] = role.capacity;
        return acc;
      },
      {} as Record<string, number>,
    );
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCapacityChange = (roleName: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setRoleCapacities((prev) => ({ ...prev, [roleName]: Math.max(0, numValue) }));
  };

  const [timeError, setTimeError] = useState('');
  const [dateError, setDateError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate time format (HHhMM with valid ranges)
    const timeMatch = formData.time.match(/^(\d{1,2})H(\d{2})$/i);
    if (!timeMatch) {
      setTimeError('Format attendu : HHhMM (ex : 15h30).');
      return;
    }
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      setTimeError('Heure invalide (heures 0-23, minutes 00-59).');
      return;
    }
    setTimeError('');

    // Validate date not in the past
    if (formData.dateISO) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const gameDate = new Date(formData.dateISO + 'T00:00:00');
      if (gameDate < today) {
        setDateError('La date ne peut pas être dans le passé.');
        return;
      }
    }
    setDateError('');

    if (gameToEdit) {
      // Update existing game with new capacities
      const updatedRoles: Role[] = gameToEdit.roles.map((role) => ({
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
    const isoDate = e.target.value; // "2025-11-15" (YYYY-MM-DD)
    if (!isoDate) return;

    // Create date from input string to avoid timezone shifts (YYYY-MM-DD is local)
    const [y, m, d] = isoDate.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);

    // Formatting to "Samedi 15 Novembre 2025"
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    const formatted = new Intl.DateTimeFormat('fr-FR', options).format(localDate);
    // Capitalize first letter (Samedi)
    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);

    // Store both ISO (for sorting) and display format
    setFormData((prev) => ({ ...prev, date: capitalized, dateISO: isoDate }));
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
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 animate-fade-in-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#3629e1] to-[#aa2e0f] rounded-xl shadow-lg">
            {gameToEdit ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                />
              </svg>
            ) : (
              <PlusIcon className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {gameToEdit ? 'Modifier le match' : 'Ajouter un nouveau match'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Renseignez les informations du match
            </p>
          </div>
        </div>

        {/* Match Info Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TEAM SELECTION */}
          <div className="space-y-1">
            <label
              htmlFor="team"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              <span aria-hidden="true">🏀</span> Équipe
            </label>
            <CustomSelect
              id="team"
              label="Équipe"
              value={formData.team}
              onChange={(val) => setFormData((prev) => ({ ...prev, team: val as string }))}
              options={[
                { value: '', label: 'Choisir une équipe' },
                ...SCBA_TEAMS.map((team) => ({ value: team, label: team })),
              ]}
            />
          </div>

          {/* OPPONENT */}
          <div className="space-y-1">
            <label
              htmlFor="opponent"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              <span aria-hidden="true">⚔️</span> Adversaire
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
              className="w-full px-4 py-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-[#3629e1] focus:border-transparent
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
            <datalist id="opponents-list">
              {uniqueOpponents.map((opp) => (
                <option key={opp} value={opp} />
              ))}
            </datalist>
          </div>

          {/* CLASSEMENTS AVANT-MATCH (CHAMPIONNAT) */}
          <div className="space-y-1">
            <label
              htmlFor="teamRank"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              <span aria-hidden="true">📊</span> Classement SCBA avant-match
            </label>
            <input
              type="text"
              id="teamRank"
              name="teamRank"
              value={formData.teamRank}
              onChange={handleChange}
              placeholder="Ex: 2 ou 2e (optionnel)"
              className="w-full px-4 py-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-[#3629e1] focus:border-transparent
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="opponentRank"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              <span aria-hidden="true">📊</span> Classement Adversaire avant-match
            </label>
            <input
              type="text"
              id="opponentRank"
              name="opponentRank"
              value={formData.opponentRank}
              onChange={handleChange}
              placeholder="Ex: 5 ou 5e (optionnel)"
              className="w-full px-4 py-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-[#3629e1] focus:border-transparent
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* DATE PICKER */}
          <div className="space-y-1">
            <label
              htmlFor="date-picker"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              <span aria-hidden="true">📅</span> Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="date-picker"
                value={getISODate(formData.date)}
                min={new Date().toISOString().split('T')[0]}
                onChange={handleDateChange}
                onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                onKeyDown={(e) => e.preventDefault()}
                required
                aria-invalid={!!dateError}
                aria-describedby={dateError ? 'date-error' : undefined}
                className="w-full px-4 py-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-[#3629e1] focus:border-transparent
                         bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer"
                style={{ colorScheme: 'dark light' }}
              />
              {dateError && (
                <p
                  id="date-error"
                  role="alert"
                  className="text-xs text-red-600 dark:text-red-400 mt-1"
                >
                  {dateError}
                </p>
              )}
            </div>
          </div>

          {/* TIME PICKER - Simple text input with auto-format */}
          <div className="space-y-1">
            <label
              htmlFor="time-picker"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              <span aria-hidden="true">⏰</span> Heure
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
                setFormData((prev) => ({ ...prev, time: formatted }));
              }}
              required
              className="w-full px-4 py-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-[#3629e1] focus:border-transparent
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* LOCATION - Conditional Input */}
          <div className="space-y-1 md:col-span-2">
            <label
              htmlFor="location"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              <span aria-hidden="true">📍</span> Lieu
            </label>

            {formData.isHome ? (
              <CustomSelect
                id="location"
                label="Lieu"
                value={formData.location}
                onChange={(val) => setFormData((prev) => ({ ...prev, location: val as string }))}
                options={[
                  { value: 'Maison des Sports', label: 'Maison des Sports' },
                  { value: 'Gymnase Fleury', label: 'Gymnase Fleury' },
                ]}
              />
            ) : (
              <>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Ex: Gymnase Chirac, Rue des Anémones, 34170 Castelnau"
                  list="locations-list"
                  required
                  aria-invalid={!!timeError}
                  aria-describedby={timeError ? 'time-error' : 'time-help'}
                  className="w-full px-4 py-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-[#3629e1] focus:border-transparent
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                {timeError ? (
                  <p
                    id="time-error"
                    role="alert"
                    className="text-xs text-red-600 dark:text-red-400 mt-1"
                  >
                    {timeError}
                  </p>
                ) : (
                  <p id="time-help" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Format : HHhMM (ex : 15h30)
                  </p>
                )}
                <datalist id="locations-list">
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <span aria-hidden="true">🗺️</span>
                  Adresse complète recommandée (nom + rue + ville) pour la navigation Waze
                </p>
              </>
            )}
          </div>
        </div>

        {/* Home/Away Toggle - Modern Segmented Control */}
        <div className="pt-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            <span aria-hidden="true">📍</span>
            Type de match
          </label>
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 border border-slate-200 dark:border-slate-600">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  isHome: true,
                  location: 'Maison des Sports',
                }))
              }
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-150 ${
                formData.isHome
                  ? 'bg-gradient-to-r from-[#3629e1] to-[#272890] text-white shadow-lg shadow-[#3629e1]/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600'
              }`}
            >
              <span className="text-lg" aria-hidden="true">
                🏠
              </span>
              Domicile
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  isHome: false,
                  location: '', // Always clear when switching to Away to prompt manual entry
                }))
              }
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-150 ${
                !formData.isHome
                  ? 'bg-gradient-to-r from-[#aa2e0f] to-[#aa2e0f] text-white shadow-lg shadow-[#aa2e0f]/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600'
              }`}
            >
              <span className="text-lg" aria-hidden="true">
                🚗
              </span>
              Extérieur
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            <span aria-hidden="true">💡</span>
            {formData.isHome
              ? 'Match à domicile : Bénévolat (Buvette, Chrono, Table, Goûter)'
              : "Match à l'extérieur : Covoiturage uniquement"}
          </p>
        </div>

        {/* Role Capacities Section - Only for editing existing HOME games */}
        {gameToEdit && formData.isHome && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-white mb-4">
              <span className="text-xl" aria-hidden="true">
                👥
              </span>
              Nombre de bénévoles par poste
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DEFAULT_ROLES.filter(
                (role) =>
                  !(['SENIOR M1', 'SENIOR M2'].includes(formData.team) && role.name === 'Goûter'),
              ).map((role) => (
                <div
                  key={role.name}
                  className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 border border-slate-200 dark:border-slate-600"
                >
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                      className="w-full px-3 py-2 text-center text-base font-bold border-2 border-slate-200 dark:border-slate-600 rounded-lg
                               bg-white dark:bg-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3629e1] focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                    {roleCapacities[role.name] === 0
                      ? '∞ illimité'
                      : `max ${roleCapacities[role.name]}`}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
              <span aria-hidden="true">💡</span>
              Mettez 0 pour un nombre illimité de bénévoles
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl
                     hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors order-2 sm:order-1"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-6 py-3 text-base font-bold text-white rounded-xl
                     bg-gradient-to-r from-[#3629e1] to-[#aa2e0f]
                     hover:opacity-90
                     shadow-lg shadow-[#3629e1]/30 hover:shadow-[#3629e1]/50
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
