import React, { useState, memo, useOptimistic, startTransition } from 'react';
import type { Role } from '../types';
import { CheckIcon } from 'lucide-react';
import { StyledRoleIcon, getRoleConfig } from '../lib/iconMap';
import ConfirmModal from './ConfirmModal';
import {
  saveMyRegistration,
  removeMyRegistration,
  getMyRegistrations,
  getStoredName,
  setStoredName,
} from '../utils/storage';
import { parseNames } from '../utils/textUtils';
import VolunteerAvatar from './VolunteerAvatar';
import EmptySlot from './EmptySlot';

interface VolunteerSlotProps {
  role: Role;
  gameId: string;
  onVolunteer: (gameId: string, roleId: string, parentName: string | string[]) => void;
  onRemoveVolunteer: (gameId: string, roleId: string, parentName: string) => void;
  onUpdateVolunteer: (gameId: string, roleId: string, oldName: string, newName: string) => void;
  isAdmin: boolean;
  animationDelay?: number;
  myRegistrationNames?: string[]; // Updated prop to support multiple
  isAuthenticated?: boolean;
  teamName?: string;
}

const SENIOR_TEAM_PATTERNS = ['SENIOR M1', 'SENIOR M2', 'SENIORS M1', 'SENIORS M2'];

const VolunteerSlot: React.FC<VolunteerSlotProps> = memo(
  ({
    role,
    gameId,
    onVolunteer,
    onRemoveVolunteer,
    onUpdateVolunteer: _onUpdateVolunteer,
    isAdmin,
    animationDelay = 0,
    myRegistrationNames = [], // Default to empty array
    isAuthenticated,
    teamName = '',
  }) => {
    // Business Rule: Hide "Goûter" role for Senior M1 and Senior M2
    // ⚡ Bolt Optimization: Only compute expensive string allocations and array traversals
    // when the role is actually 'Goûter', preventing redundant O(1) rendering bottlenecks
    // on all other roles (e.g. Arbitre, Table) during the GameCard component's render cycle.
    if (role.name === 'Goûter') {
      const upperTeam = teamName.toUpperCase();
      const isSeniorTeam = SENIOR_TEAM_PATTERNS.some((t) => upperTeam.includes(t));
      if (isSeniorTeam) {
        return null; // Do not render this slot
      }
    }

    const [newName, setNewName] = useState('');
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [editingVolunteer, setEditingVolunteer] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
      isOpen: boolean;
      type: 'add' | 'remove';
      name: string;
    }>({ isOpen: false, type: 'add', name: '' });

    // React 19 Optimistic UI
    const [optimisticVolunteers, setOptimisticVolunteers] = useOptimistic(
      role.volunteers,
      (currentVolunteers: string[], action: { type: 'add' | 'remove'; names: string[] }) => {
        if (action.type === 'add') {
          return [...currentVolunteers, ...action.names];
        } else if (action.type === 'remove') {
          return currentVolunteers.filter((v) => !action.names.includes(v));
        }
        return currentVolunteers;
      },
    );

    // Use optimistic state for calculations
    const isUnlimited = role.capacity === Infinity || role.capacity === 0;

    // For fixed capacity roles, we want to show EXACTLY role.capacity slots.
    const effectiveCapacity = isUnlimited
      ? Math.max(optimisticVolunteers.length + 1, 4)
      : role.capacity;

    // Derived state
    const currentCount = optimisticVolunteers.length;
    const isFull = !isUnlimited && currentCount >= role.capacity;
    const registrationKey = `${gameId}-${role.id}`;

    // ⚡ Bolt Optimization: Wrap localStorage parsing in useMemo with currentCount dependency
    // This prevents N+1 synchronous blocking reads inside the rendering loop while automatically staying
    // up to date when the component's slot count changes (e.g. after confirming sign up or removing volunteer).
    const localRegistrations = React.useMemo(() => {
      return isAuthenticated ? [] : getMyRegistrations()[registrationKey] || [];
    }, [isAuthenticated, registrationKey, currentCount]);

    // UX Peak Smart Defaults: récupérer le nom enregistré pour proposer l'inscription 1-tap
    const storedUserName = React.useMemo(() => getStoredName(), [currentCount]);

    const handleSignUpClick = () => {
      if (newName.trim()) {
        setConfirmModal({ isOpen: true, type: 'add', name: newName.trim() });
      }
    };

    const toggleInput = () => {
      if (!isFull) {
        setIsInputVisible(true);
      }
    };

    const confirmSignUp = () => {
      const name = confirmModal.name;
      const names = parseNames(name);

      startTransition(() => {
        setOptimisticVolunteers({ type: 'add', names });
      });

      onVolunteer(gameId, role.id, names);

      if (!isAuthenticated) {
        names.forEach((n) => saveMyRegistration(registrationKey, n));
      }

      // UX Peak Smart Defaults: mémoriser automatiquement le nom pour les prochaines inscriptions
      if (names[0]) {
        setStoredName(names[0]);
      }

      setNewName('');
      setIsInputVisible(false);
      setConfirmModal({ isOpen: false, type: 'add', name: '' });
    };

    const handleRemoveClick = (volunteerName: string) => {
      setConfirmModal({ isOpen: true, type: 'remove', name: volunteerName });
    };

    const confirmRemove = () => {
      const name = confirmModal.name;

      startTransition(() => {
        setOptimisticVolunteers({ type: 'remove', names: [name] });
      });

      onRemoveVolunteer(gameId, role.id, name);
      removeMyRegistration(registrationKey, name);
      setConfirmModal({ isOpen: false, type: 'remove', name: '' });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !editingVolunteer) {
        handleSignUpClick();
      }
      if (e.key === 'Escape') {
        setIsInputVisible(false);
        setEditingVolunteer(null);
        setNewName('');
      }
    };

    // Role Styling
    const roleConfig = getRoleConfig(role.name);

    return (
      <div
        className="py-3.5 px-1.5 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0 transition-colors"
        style={{ animationDelay: `${animationDelay}s` }}
      >
        {/* Role Row Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-shrink-0">
              <StyledRoleIcon role={role.name} size="md" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg leading-tight truncate">
                {role.name}
              </h3>
              {currentCount < role.capacity && !isUnlimited && (
                <p className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 leading-tight mt-0.5">
                  {role.capacity - currentCount} place{role.capacity - currentCount > 1 ? 's' : ''}{' '}
                  libre{role.capacity - currentCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          {isFull && !isUnlimited ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs sm:text-sm font-black border border-emerald-500/20 flex-shrink-0">
              <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />
              Complet
            </span>
          ) : (
            <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
              {isUnlimited ? `${currentCount} inscrits` : `${currentCount} / ${role.capacity}`}
            </span>
          )}
        </div>

        {/* Volunteers & Empty Slots Row (Horizontally Scrollable / Wrap on mobile) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
          {/* 1. Filled Slots */}
          {optimisticVolunteers.map((volunteer) => {
            const isMine = isAuthenticated
              ? myRegistrationNames.includes(volunteer)
              : localRegistrations.includes(volunteer);

            return (
              <VolunteerAvatar
                key={volunteer}
                name={volunteer}
                avatarUrl={role.avatars?.[volunteer]}
                isMine={isMine}
                isAdmin={isAdmin}
                onRemove={() => handleRemoveClick(volunteer)}
              />
            );
          })}

          {/* 2. Empty Slots */}
          {(!isFull || isUnlimited) &&
            !isInputVisible &&
            Array.from({ length: Math.max(0, effectiveCapacity - currentCount) }).map((_, idx) => (
              <EmptySlot
                key={`empty-${idx}`}
                onClick={toggleInput}
                isUrgent={!isUnlimited && idx === 0 && role.capacity - currentCount <= 2}
              />
            ))}
        </div>

        {/* Inline Input Form with Smart Defaults (UX Peak) */}
        {isInputVisible && (
          <div className="pt-3 pb-1 animate-fade-in-down">
            <div className="bg-slate-50/90 dark:bg-slate-900/70 p-3 sm:p-4 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 shadow-xs space-y-2.5">
              {/* Quick 1-tap preset if known (UX Peak 70-90% rule) */}
              {storedUserName && !newName && (
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmModal({ isOpen: true, type: 'add', name: storedUserName });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100/80 hover:bg-blue-200/80 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#3629e1] dark:text-blue-300 text-xs font-black border border-blue-200/80 dark:border-blue-700/60 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>
                      M'inscrire en tant que <strong>{storedUserName}</strong>
                    </span>
                    <span className="text-[10px] bg-[#3629e1] text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-black">
                      1-clic
                    </span>
                  </button>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    ou saisir un autre nom ci-dessous :
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    storedUserName
                      ? `Autre nom (ex: ${storedUserName})...`
                      : 'Votre Prénom et Nom...'
                  }
                  className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 min-h-[44px] text-base focus:ring-2 focus:ring-[#3629e1] outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  autoFocus={!storedUserName}
                />
                <button
                  onClick={() => setIsInputVisible(false)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Annuler"
                >
                  ✕
                </button>
                <button
                  onClick={handleSignUpClick}
                  disabled={!newName.trim()}
                  className="px-5 py-2.5 min-h-[44px] flex items-center justify-center bg-[#3629e1] hover:bg-[#2a21b4] text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Valider
                </button>
              </div>

              {/* Reassurance copy under CTA (UX Peak - Resolving Objections) */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-500 font-black">✓</span>
                Désistement possible à tout moment en 1 clic si imprévu.
              </p>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.type === 'add' ? "Rejoindre l'équipe" : 'Se désister'}
          message={
            confirmModal.type === 'add'
              ? `Confirmer l'inscription de "${confirmModal.name}" en ${role.name} ? Un empêchement ? Vous pourrez vous désister à tout moment.`
              : `Voulez-vous libérer la place de ${confirmModal.name} ?`
          }
          confirmText={confirmModal.type === 'add' ? "Confirmer l'inscription" : 'Libérer la place'}
          confirmStyle={confirmModal.type === 'add' ? 'success' : 'danger'}
          onConfirm={confirmModal.type === 'add' ? confirmSignUp : confirmRemove}
          onCancel={() => setConfirmModal({ isOpen: false, type: 'add', name: '' })}
        />
      </div>
    );
  },
);

VolunteerSlot.displayName = 'VolunteerSlot';

export default VolunteerSlot;
