import React, { useState, memo, useOptimistic, startTransition } from 'react';
import type { Role } from '../types';
import { DeleteIcon, EditPencilIcon, CheckIcon, UserIcon } from './Icons';
import { StyledRoleIcon, getRoleConfig } from '../lib/iconMap';
import { Hand, CheckCircle, Sparkles } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { saveMyRegistration, removeMyRegistration, isMyRegistration, claimRegistration, mightBeMyRegistration } from '../utils/storage';
import { parseNames } from '../utils/textUtils';


interface VolunteerSlotProps {
    role: Role;
    gameId: string;
    onVolunteer: (parentName: string | string[]) => void;
    onRemoveVolunteer: (parentName: string) => void;
    onUpdateVolunteer: (oldName: string, newName: string) => void;
    isAdmin: boolean;
    animationDelay?: number;
    myRegistrationName?: string;
    isAuthenticated?: boolean;
}

// Icons now handled by RoleIcon component from lib/iconMap.tsx

const VolunteerSlot: React.FC<VolunteerSlotProps> = memo(({
    role,
    gameId,
    onVolunteer,
    onRemoveVolunteer,
    onUpdateVolunteer,
    isAdmin,
    animationDelay = 0,
    myRegistrationName,
    isAuthenticated
}) => {
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
    const canSignUp = isUnlimited || optimisticVolunteers.length < role.capacity;
    const isFull = !isUnlimited && optimisticVolunteers.length >= role.capacity;
    // Registration key remains based on props, assuming role.id is stable
    const registrationKey = `${gameId}-${role.id}`;

    const handleSignUpClick = () => {
        if (newName.trim() && canSignUp) {
            setConfirmModal({ isOpen: true, type: 'add', name: newName.trim() });
        }
    };

    const confirmSignUp = () => {
        const name = confirmModal.name;
        const names = parseNames(name);

        // Optimistic Update
        startTransition(() => {
            setOptimisticVolunteers({ type: 'add', names });
        });

        // Atomic update for all names
        onVolunteer(names);

        // Local storage backup (loop needed as it likely handles 1 by 1 or we check implementation)
        // verify saveMyRegistration signature? It likely takes string.
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

        // Optimistic Update
        startTransition(() => {
            setOptimisticVolunteers({ type: 'remove', names: [name] });
        });

        onRemoveVolunteer(name);
        removeMyRegistration(registrationKey, name);
        setConfirmModal({ isOpen: false, type: 'remove', name: '' });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (editingVolunteer) {
                handleUpdate();
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
            const names = parseNames(newName);

            // Optimistic Update
            startTransition(() => {
                setOptimisticVolunteers({ type: 'remove', names: [editingVolunteer] });
                setOptimisticVolunteers({ type: 'add', names });
            });

            if (names.length === 1) {
                // Standard update
                const updatedName = names[0];
                removeMyRegistration(registrationKey, editingVolunteer);
                if (!isAuthenticated) {
                    saveMyRegistration(registrationKey, updatedName);
                }
                onUpdateVolunteer(editingVolunteer, updatedName);
            } else {
                // Split logic: Remove old + Add new ones
                onRemoveVolunteer(editingVolunteer);
                removeMyRegistration(registrationKey, editingVolunteer);

                names.forEach(n => {
                    onVolunteer(n);
                    if (!isAuthenticated) saveMyRegistration(registrationKey, n);
                });
            }
            cancelEditing();
        }
    };

    const capacityText =
        isUnlimited
            ? `${role.volunteers.length}`
            : `${role.volunteers.length}/${role.capacity}`;

    // Get role-specific color configuration for modern styling
    const roleConfig = getRoleConfig(role.name);

    return (
        <>
            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.type === 'add' ? 'Confirmer l\'inscription' : 'Se désinscrire ?'}
                message={
                    confirmModal.type === 'add'
                        ? (() => {
                            const names = parseNames(confirmModal.name);
                            if (names.length > 1) {
                                return `Voulez-vous inscrire ces ${names.length} personnes : ${names.join(", ")} ?`;
                            }
                            return `Voulez-vous vous inscrire en tant que "${confirmModal.name}" pour ${role.name} ?`;
                        })()
                        : `Êtes-vous sûr de vouloir vous désinscrire de ${role.name} ?`
                }
                confirmText={confirmModal.type === 'add' ? 'Je confirme !' : 'Me désinscrire'}
                confirmStyle={confirmModal.type === 'add' ? 'success' : 'danger'}
                onConfirm={confirmModal.type === 'add' ? confirmSignUp : confirmRemove}
                onCancel={() => setConfirmModal({ isOpen: false, type: 'add', name: '' })}
            />

            {/* Compact List Row Style */}
            <div
                className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden"
                style={{ animationDelay: `${animationDelay}s` }}
            >
                {/* Role Header - Modern gradient with colored accent */}
                <div className={`
                    flex items-center justify-between px-3 py-3
                    bg-gradient-to-r ${roleConfig.gradientFrom} ${roleConfig.gradientTo}
                    dark:from-slate-800 dark:to-slate-900
                    border-l-4 ${roleConfig.borderColor}
                    ${isFull ? 'border-l-emerald-500' : ''}
                `}>
                    <div className="flex items-center gap-3">
                        <StyledRoleIcon role={role.name} size="md" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{role.name}</span>
                    </div>
                    <span className={`
                        px-2.5 py-1 rounded-full text-xs font-bold
                        ${isFull
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }
                    `}>
                        {isFull ? '✓ Complet' : capacityText}
                    </span>
                </div>

                {/* Volunteers List */}
                <div className="divide-y divide-slate-50 dark:divide-slate-700">
                    {optimisticVolunteers.map((volunteer, idx) => {
                        const isMine = isAuthenticated
                            ? (myRegistrationName === volunteer)
                            : isMyRegistration(registrationKey, volunteer);

                        return editingVolunteer === volunteer ? (
                            // Editing mode
                            <div key={volunteer} className="flex items-center gap-2 p-2 bg-blue-50">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 min-w-0 px-3 py-2 min-h-[44px] text-sm border border-blue-300 rounded-lg
                                               focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                    autoFocus
                                />
                                <button
                                    onClick={cancelEditing}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                                    aria-label="Annuler la modification"
                                >
                                    ✕
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                                    aria-label="Confirmer la modification"
                                >
                                    <CheckIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div
                                key={volunteer}
                                className={`
                                    flex items-center justify-between gap-2 px-3 py-2
                                    ${isMine ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800'}
                                `}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                                        ${isMine
                                            ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                                            : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                                        }
                                        shadow-sm
                                    `}>
                                        {isMine ? (
                                            <UserIcon className="w-3 h-3 text-white" />
                                        ) : (
                                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                                        )}
                                    </div>
                                    <span className={`text-sm font-medium truncate ${isMine ? 'text-blue-800 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {volunteer}
                                    </span>
                                    {isMine && (
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                                            Vous
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {/* Admin can remove anyone */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleRemoveClick(volunteer)}
                                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            aria-label={`Supprimer ${volunteer}`}
                                        >
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    {/* User can only remove their own registration */}
                                    {!isAdmin && isMine && (
                                        <button
                                            onClick={() => handleRemoveClick(volunteer)}
                                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            aria-label="Se désinscrire"
                                        >
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    {/* User can edit their own registration */}
                                    {!isAdmin && isMine && (
                                        <button
                                            onClick={() => startEditing(volunteer)}
                                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                            aria-label="Modifier mon nom"
                                        >
                                            <EditPencilIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    {/* Identity recovery */}
                                    {!isAdmin && !isMine && mightBeMyRegistration(volunteer) && (
                                        <button
                                            onClick={() => {
                                                claimRegistration(registrationKey, volunteer);
                                                setNewName('');
                                            }}
                                            className="min-h-[44px] px-3 py-2 text-sm font-medium text-amber-700 bg-amber-100
                                                       hover:bg-amber-200 rounded-lg transition-colors"
                                            title="Récupérer cette inscription"
                                        >
                                            C'est moi ?
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Sign Up Row */}
                    {canSignUp && !editingVolunteer && (
                        <div className="p-2">
                            {isInputVisible ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Votre nom..."
                                        className="flex-1 min-w-0 px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-lg
                                                   focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => { setIsInputVisible(false); setNewName(''); }}
                                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                                        aria-label="Annuler l'inscription"
                                    >
                                        ✕
                                    </button>
                                    <button
                                        onClick={handleSignUpClick}
                                        disabled={!newName.trim()}
                                        className="min-w-[44px] min-h-[44px] px-4 flex items-center justify-center text-sm font-semibold text-white bg-red-500 rounded-lg
                                                   hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        OK
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsInputVisible(true)}
                                    className="w-full min-h-[44px] py-3 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-xl
                                               hover:from-red-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg
                                               flex items-center justify-center gap-2"
                                >
                                    <Hand className="w-5 h-5" />
                                    <span>Je m'inscris</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Full Message */}
                    {isFull && optimisticVolunteers.length > 0 && (
                        <div className="px-3 py-2.5 text-center bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Merci à tous les bénévoles !
                            </span>
                        </div>
                    )}
                </div>
            </div >
        </>
    );
});

VolunteerSlot.displayName = 'VolunteerSlot';

export default VolunteerSlot;