import React, { useState, memo } from 'react';
import type { Role } from '../types';
import { RemoveUserIcon, EditPencilIcon, CheckIcon, UserIcon } from './Icons';
import ConfirmModal from './ConfirmModal';
import { saveMyRegistration, removeMyRegistration, isMyRegistration, claimRegistration, mightBeMyRegistration } from '../utils/storage';

interface VolunteerSlotProps {
    role: Role;
    gameId: string;
    onVolunteer: (parentName: string) => void;
    onRemoveVolunteer: (parentName: string) => void;
    onUpdateVolunteer: (oldName: string, newName: string) => void;
    isAdmin: boolean;
    animationDelay?: number;
    myRegistrationName?: string;
    isAuthenticated?: boolean;
}

// Emoji mapping for roles (outside component to prevent recreation)
const ROLE_EMOJIS: Record<string, string> = {
    'Buvette': '🍺',
    'Chrono': '⏱️',
    'Table de marque': '📋',
    'Goûter': '🍪',
};

const getRoleEmoji = (roleName: string): string => ROLE_EMOJIS[roleName] || '👋';

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
    const [editingVolunteer, setEditingVolunteer] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'add' | 'remove';
        name: string;
    }>({ isOpen: false, type: 'add', name: '' });

    // Note: capacity=0 means unlimited (Infinity can't be stored in JSON/localStorage)
    const isUnlimited = role.capacity === Infinity || role.capacity === 0;
    const canSignUp = isUnlimited || role.volunteers.length < role.capacity;
    const isFull = !isUnlimited && role.volunteers.length >= role.capacity;
    const registrationKey = `${gameId}-${role.id}`;

    const handleSignUpClick = () => {
        if (newName.trim() && canSignUp) {
            setConfirmModal({ isOpen: true, type: 'add', name: newName.trim() });
        }
    };

    const confirmSignUp = () => {
        const name = confirmModal.name;
        onVolunteer(name);
        // Only save to localStorage if NOT authenticated (guests)
        if (!isAuthenticated) {
            saveMyRegistration(registrationKey, name);
        }
        setNewName('');
        setConfirmModal({ isOpen: false, type: 'add', name: '' });
    };

    const handleRemoveClick = (volunteerName: string) => {
        setConfirmModal({ isOpen: true, type: 'remove', name: volunteerName });
    };

    const confirmRemove = () => {
        const name = confirmModal.name;
        onRemoveVolunteer(name);
        // Remove from localStorage regardless, just to be clean
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
            // Update registration tracking
            removeMyRegistration(registrationKey, editingVolunteer);
            if (!isAuthenticated) {
                saveMyRegistration(registrationKey, newName.trim());
            }
            onUpdateVolunteer(editingVolunteer, newName.trim());
            cancelEditing();
        }
    };

    const capacityText =
        isUnlimited
            ? `${role.volunteers.length} inscrit(s)`
            : `${role.volunteers.length}/${role.capacity}`;

    return (
        <>
            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.type === 'add' ? 'Confirmer l\'inscription' : 'Se désinscrire ?'}
                message={
                    confirmModal.type === 'add'
                        ? `Voulez-vous vous inscrire en tant que "${confirmModal.name}" pour ${role.name} ?`
                        : `Êtes-vous sûr de vouloir vous désinscrire de ${role.name} ?`
                }
                confirmText={confirmModal.type === 'add' ? 'Je confirme !' : 'Me désinscrire'}
                confirmStyle={confirmModal.type === 'add' ? 'success' : 'danger'}
                onConfirm={confirmModal.type === 'add' ? confirmSignUp : confirmRemove}
                onCancel={() => setConfirmModal({ isOpen: false, type: 'add', name: '' })}
            />

            <div
                className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 
                   transition-all duration-300 hover:shadow-md hover:border-red-200"
                style={{ animationDelay: `${animationDelay}s` }}
            >
                {/* Header - Role name and capacity */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{getRoleEmoji(role.name)}</span>
                        <span className="font-bold text-slate-800 text-base">{role.name}</span>
                    </div>
                    <span className={`
            px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
            ${isFull
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-600'
                        }
          `}>
                        {isFull ? '✓ Complet' : capacityText}
                    </span>
                </div>

                {/* Volunteers List */}
                <div className="space-y-2">
                    {role.volunteers.map((volunteer, idx) => {
                        // Crucial Logic:
                        // If Authenticated: Only trust Cloud Identity (myRegistrationName)
                        // If Guest (Not Authenticated): Trust LocalStorage (isMyRegistration)
                        const isMine = isAuthenticated
                            ? (myRegistrationName === volunteer)
                            : isMyRegistration(registrationKey, volunteer);

                        return editingVolunteer === volunteer ? (
                            // Editing mode
                            <div key={volunteer} className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 min-w-0 px-4 py-3 text-base border-2 border-red-300 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                           bg-white"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={cancelEditing}
                                        className="flex-1 sm:flex-none px-4 py-3 text-sm font-semibold text-slate-600 
                             bg-slate-200 rounded-xl hover:bg-slate-300 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        className="flex-1 sm:flex-none px-4 py-3 text-sm font-semibold text-white 
                             bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl 
                             hover:from-emerald-600 hover:to-teal-600 transition-all
                             flex items-center justify-center gap-2"
                                    >
                                        <CheckIcon className="w-4 h-4" />
                                        <span>OK</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Display mode
                            <div
                                key={volunteer}
                                className={`flex items-center justify-between gap-2 p-3 rounded-xl group
                  ${isMine
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                                        : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'
                                    }`}
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${isMine
                                            ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                                            : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                                        }`}>
                                        <UserIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className={`font-medium truncate block ${isMine ? 'text-blue-800' : 'text-emerald-800'}`}>
                                            {volunteer}
                                        </span>
                                        {isMine && (
                                            <span className="text-xs text-blue-600">C'est vous !</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {/* Admin can remove anyone */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleRemoveClick(volunteer)}
                                            className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-500"
                                            aria-label={`Supprimer ${volunteer}`}
                                        >
                                            <RemoveUserIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    {/* User can only remove their own registration */}
                                    {!isAdmin && isMine && (
                                        <button
                                            onClick={() => handleRemoveClick(volunteer)}
                                            className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-500 
                               opacity-70 hover:opacity-100"
                                            aria-label="Se désinscrire"
                                            title="Se désinscrire"
                                        >
                                            <RemoveUserIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    {/* User can edit their own registration */}
                                    {!isAdmin && isMine && (
                                        <button
                                            onClick={() => startEditing(volunteer)}
                                            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                                            aria-label="Modifier mon nom"
                                            title="Modifier mon nom"
                                        >
                                            <EditPencilIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    {/* Identity recovery: "C'est moi ?" button - only shows if name matches stored name */}
                                    {!isAdmin && !isMine && mightBeMyRegistration(volunteer) && (
                                        <button
                                            onClick={() => {
                                                claimRegistration(registrationKey, volunteer);
                                                // Force re-render by clearing state
                                                setNewName('');
                                            }}
                                            className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 
                                               hover:bg-amber-200 rounded-lg transition-colors"
                                            title="Récupérer cette inscription sur cet appareil"
                                        >
                                            C'est moi ?
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Sign Up Input */}
                    {canSignUp && !editingVolunteer && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Entrez votre nom..."
                                    className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                           bg-white placeholder:text-slate-400"
                                />
                                <button
                                    onClick={handleSignUpClick}
                                    disabled={!newName.trim()}
                                    className="w-full py-3 px-4 text-base font-bold text-white 
                           bg-gradient-to-r from-red-500 to-orange-500 rounded-xl
                           hover:from-red-600 hover:to-orange-600 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-300 transform hover:scale-[1.02]
                           shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                                >
                                    ✋ Je m'inscris !
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Full Message */}
                    {isFull && (
                        <div className="mt-3 pt-3 border-t border-slate-200 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 
                            rounded-full border border-emerald-200">
                                <span className="text-xl">🎉</span>
                                <span className="text-emerald-700 font-semibold">Complet ! Merci à tous !</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
});

VolunteerSlot.displayName = 'VolunteerSlot';

export default VolunteerSlot;