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

// Emoji mapping for roles
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
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [editingVolunteer, setEditingVolunteer] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'add' | 'remove';
        name: string;
    }>({ isOpen: false, type: 'add', name: '' });

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
        if (!isAuthenticated) {
            saveMyRegistration(registrationKey, name);
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
            ? `${role.volunteers.length}`
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

            {/* Compact List Row Style */}
            <div
                className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden"
                style={{ animationDelay: `${animationDelay}s` }}
            >
                {/* Role Header Row */}
                <div className={`
                    flex items-center justify-between px-3 py-2.5
                    ${isFull ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800'}
                    border-b border-slate-100 dark:border-slate-700
                `}>
                    <div className="flex items-center gap-2">
                        <span className="text-base">{getRoleEmoji(role.name)}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{role.name}</span>
                    </div>
                    <span className={`
                        px-2 py-0.5 rounded-full text-xs font-semibold
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
                    {role.volunteers.map((volunteer, idx) => {
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
                                    className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-blue-300 rounded-lg
                                               focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                    autoFocus
                                />
                                <button
                                    onClick={cancelEditing}
                                    className="px-2 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                                >
                                    ✕
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="px-2 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                                >
                                    <CheckIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            // Display mode - Compact Row
                            <div
                                key={volunteer}
                                className={`
                                    flex items-center justify-between gap-2 px-3 py-2
                                    ${isMine ? 'bg-blue-50' : 'bg-white'}
                                `}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                                        ${isMine
                                            ? 'bg-blue-500'
                                            : 'bg-emerald-500'
                                        }
                                    `}>
                                        <UserIcon className="w-3 h-3 text-white" />
                                    </div>
                                    <span className={`text-sm font-medium truncate ${isMine ? 'text-blue-800' : 'text-slate-700'}`}>
                                        {volunteer}
                                    </span>
                                    {isMine && (
                                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                                            Vous
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {/* Admin can remove anyone */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleRemoveClick(volunteer)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            aria-label={`Supprimer ${volunteer}`}
                                        >
                                            <RemoveUserIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    {/* User can only remove their own registration */}
                                    {!isAdmin && isMine && (
                                        <button
                                            onClick={() => handleRemoveClick(volunteer)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            aria-label="Se désinscrire"
                                        >
                                            <RemoveUserIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    {/* User can edit their own registration */}
                                    {!isAdmin && isMine && (
                                        <button
                                            onClick={() => startEditing(volunteer)}
                                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                                            aria-label="Modifier mon nom"
                                        >
                                            <EditPencilIcon className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {/* Identity recovery */}
                                    {!isAdmin && !isMine && mightBeMyRegistration(volunteer) && (
                                        <button
                                            onClick={() => {
                                                claimRegistration(registrationKey, volunteer);
                                                setNewName('');
                                            }}
                                            className="px-1.5 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-100
                                                       hover:bg-amber-200 rounded-md transition-colors"
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
                                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-lg
                                                   focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => { setIsInputVisible(false); setNewName(''); }}
                                        className="px-2.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                                    >
                                        ✕
                                    </button>
                                    <button
                                        onClick={handleSignUpClick}
                                        disabled={!newName.trim()}
                                        className="px-3 py-2 text-xs font-semibold text-white bg-red-500 rounded-lg
                                                   hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        OK
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsInputVisible(true)}
                                    className="w-full py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-xl
                                               hover:from-red-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg
                                               flex items-center justify-center gap-2"
                                >
                                    <span className="text-lg">✋</span>
                                    <span>Je m'inscris</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Full Message */}
                    {isFull && role.volunteers.length > 0 && (
                        <div className="px-3 py-2 text-center">
                            <span className="text-xs text-emerald-600 font-medium">✨ Merci à tous !</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
});

VolunteerSlot.displayName = 'VolunteerSlot';

export default VolunteerSlot;