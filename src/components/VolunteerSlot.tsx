import React, { useState, memo, useOptimistic, startTransition } from 'react';
import type { Role } from '../types';
import { CheckIcon } from 'lucide-react';
import { StyledRoleIcon, getRoleConfig } from '../lib/iconMap';
import ConfirmModal from './ConfirmModal';
import { saveMyRegistration, removeMyRegistration, isMyRegistration, mightBeMyRegistration } from '../utils/storage';
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

const VolunteerSlot: React.FC<VolunteerSlotProps> = memo(({
    role,
    gameId,
    onVolunteer,
    onRemoveVolunteer,
    onUpdateVolunteer,
    isAdmin,
    animationDelay = 0,
    myRegistrationNames = [], // Default to empty array
    isAuthenticated,
    teamName = ''
}) => {
    // Business Rule: Hide "Goûter" role for Senior M1 and Senior M2
    const isSeniorTeam = ['SENIOR M1', 'SENIOR M2', 'Seniors M1', 'Seniors M2'].some(t =>
        teamName.toUpperCase().includes(t.toUpperCase())
    );
    if (role.name === 'Goûter' && isSeniorTeam) {
        return null; // Do not render this slot
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
        (currentVolunteers: string[], action: { type: 'add' | 'remove', names: string[] }) => {
            if (action.type === 'add') {
                return [...currentVolunteers, ...action.names];
            } else if (action.type === 'remove') {
                return currentVolunteers.filter(v => !action.names.includes(v));
            }
            return currentVolunteers;
        }
    );

    // Use optimistic state for calculations
    const isUnlimited = role.capacity === Infinity || role.capacity === 0;

    // For fixed capacity roles, we want to show EXACTLY role.capacity slots.
    const effectiveCapacity = isUnlimited ? Math.max(optimisticVolunteers.length + 1, 4) : role.capacity;

    // Derived state
    const currentCount = optimisticVolunteers.length;
    const isFull = !isUnlimited && currentCount >= role.capacity;
    const registrationKey = `${gameId}-${role.id}`;

    const handleSignUpClick = () => {
        if (newName.trim()) {
            setConfirmModal({ isOpen: true, type: 'add', name: newName.trim() });
        }
    };

    const toggleInput = () => {
        if (!isFull) {
            setIsInputVisible(true);
        }
    }

    const confirmSignUp = () => {
        const name = confirmModal.name;
        const names = parseNames(name);

        startTransition(() => {
            setOptimisticVolunteers({ type: 'add', names });
        });

        onVolunteer(gameId, role.id, names);

        if (!isAuthenticated) {
            names.forEach(n => saveMyRegistration(registrationKey, n));
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
        if (e.key === 'Enter') {
            if (editingVolunteer) {
                // handleUpdate(); 
            } else {
                handleSignUpClick();
            }
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
            className="mb-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden"
            style={{ animationDelay: `${animationDelay}s` }}
        >
            {/* Header */}
            <div className={`
                flex items-center justify-between px-4 py-3
                bg-slate-50 dark:bg-slate-900/50
                border-b border-slate-100 dark:border-slate-700
                border-l-4 ${roleConfig.borderColor}
            `}>
                <div className="flex items-center gap-3">
                    <StyledRoleIcon role={role.name} size="md" />
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{role.name}</h3>
                        {currentCount < role.capacity && !isUnlimited && (
                            <p className="text-[10px] font-medium text-red-500 animate-pulse">
                                Recherche {role.capacity - currentCount} bénévole{role.capacity - currentCount > 1 ? 's' : ''} !
                            </p>
                        )}
                    </div>
                </div>
                {/* Status Text */}
                {/* Status Text or Badge */}
                {
                    isFull && !isUnlimited ? (
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                            <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />
                            Complet
                        </span>
                    ) : (
                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/50 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            {isUnlimited ? `${currentCount} inscrits` : `${currentCount} / ${role.capacity}`}
                        </span>
                    )
                }
            </div>

            {/* Roster Grid */}
            <div className="p-4 grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-6 justify-items-center">

                {/* 1. Filled Slots */}
                {optimisticVolunteers.map((volunteer) => {
                    const isMine = isAuthenticated
                        ? myRegistrationNames.includes(volunteer) // Check if name exists in my list
                        : isMyRegistration(registrationKey, volunteer);

                    // Check if it's potentially me for recovery
                    const isLostAndFound = !isAdmin && !isMine && mightBeMyRegistration(volunteer);

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

                {/* 2. Empty Slots (Placeholders) */}
                {(!isFull || isUnlimited) && !isInputVisible && Array.from({ length: Math.max(0, effectiveCapacity - currentCount) }).map((_, idx) => (
                    <EmptySlot
                        key={`empty-${idx}`}
                        onClick={toggleInput}
                        isUrgent={!isUnlimited && idx === 0 && (role.capacity - currentCount) <= 2}
                    />
                ))}
            </div>

            {/* Inline Input Form */}
            {isInputVisible && (
                <div className="px-4 pb-4 animate-fade-in-down">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-blue-200 dark:border-blue-800 flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Votre Prénom et Nom..."
                            className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 min-h-[44px] text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                        <button
                            onClick={() => setIsInputVisible(false)}
                            className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            aria-label="Annuler"
                        >
                            ✕
                        </button>
                        <button
                            onClick={handleSignUpClick}
                            disabled={!newName.trim()}
                            className="px-5 py-2.5 min-h-[44px] flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Valider
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.type === 'add' ? 'Rejoindre l\'équipe' : 'Se désister'}
                message={
                    confirmModal.type === 'add'
                        ? `Confirmer l'inscription de "${confirmModal.name}" en ${role.name} ?`
                        : `Voulez-vous libérer la place de ${confirmModal.name} ?`
                }
                confirmText={confirmModal.type === 'add' ? 'C\'est parti !' : 'Libérer la place'}
                confirmStyle={confirmModal.type === 'add' ? 'success' : 'danger'}
                onConfirm={confirmModal.type === 'add' ? confirmSignUp : confirmRemove}
                onCancel={() => setConfirmModal({ isOpen: false, type: 'add', name: '' })}
            />
        </div>
    );
});

VolunteerSlot.displayName = 'VolunteerSlot';

export default VolunteerSlot;