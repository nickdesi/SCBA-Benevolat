import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useGames } from '../utils/useGames'; // Adjust import path as needed
import { getTodayISO, parseFrenchDate } from '../utils/dateUtils';
import { CalendarIcon, ClockIcon, LocationIcon, DeleteIcon } from './Icons';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

interface UserRegistration {
    id: string; // gameId_roleId
    gameId: string;
    roleId: string;
    roleName: string;
    gameDate: string; // ISO or formatted
    gameTime: string; // approx
    team: string; // opponent usually or "My Team" context
    opponent: string;
    location: string;
    volunteerName?: string; // The specific name used for this registration
    gameDateISO?: string;
    isValid?: boolean; // New flag to track if registration exists in public game
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user }) => {
    const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
    const [loading, setLoading] = useState(true);

    console.log("ProfileModal rendered. isOpen:", isOpen);

    // We can fetch user's specific registrations directly from their subcollection
    // or assume useGames context. fetching directly ensures freshness.
    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchRegistrations = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, `users/${user.uid}/registrations`));
                const snapshot = await getDocs(q);

                const regsPromises = snapshot.docs.map(async d => {
                    const data = d.data();
                    const reg: UserRegistration = {
                        id: d.id,
                        gameId: data.gameId,
                        roleId: data.roleId,
                        roleName: data.roleName,
                        gameDate: typeof data.gameDate === 'string' ? data.gameDate : (data.gameDate ? String(data.gameDate) : undefined),
                        gameDateISO: data.gameDateISO,
                        team: data.team, // actually 'team' field
                        opponent: data.opponent,
                        location: data.location || 'Gymnase non spécifié', // Might be missing in snapshot if not saved
                        gameTime: data.gameTime || '',
                        volunteerName: data.volunteerName,
                        isValid: true // Default to true, verify below
                    };

                    // Verify against public game data
                    try {
                        const gameSnap = await getDoc(doc(db, 'matches', reg.gameId));
                        if (gameSnap.exists()) {
                            const gameData = gameSnap.data();
                            const role = gameData.roles?.find((r: any) => r.id === reg.roleId);
                            if (role) {
                                // Check if the volunteer name is still in the list
                                const nameToCheck = reg.volunteerName || user.displayName;
                                const isStillRegistered = role.volunteers.includes(nameToCheck);
                                reg.isValid = isStillRegistered;
                            } else {
                                reg.isValid = false; // Role deleted?
                            }
                        } else {
                            reg.isValid = false; // Game deleted
                        }
                    } catch (e) {
                        console.warn("Could not verify registration validity", e);
                        // Keep as true or maybe unknowns? Let's assume true but log warning.
                    }

                    return reg;
                });

                const regs = await Promise.all(regsPromises);

                // Sort by date (ascending)
                regs.sort((a, b) => {
                    if (a.gameDateISO && b.gameDateISO) {
                        return a.gameDateISO.localeCompare(b.gameDateISO);
                    }
                    return 0;
                });

                setRegistrations(regs);
            } catch (err) {
                console.error("Error fetching registrations", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRegistrations();
    }, [isOpen, user]);

    const handleDelete = async (regId: string, gameId: string, roleId: string, volunteerName?: string, isValid: boolean = true) => {
        const confirmMessage = isValid
            ? "Voulez-vous vraiment annuler cette inscription ?"
            : "Voulez-vous supprimer cette inscription obsolète de votre profil ?";

        if (!confirm(confirmMessage)) return;

        try {
            // 1. Remove from Public Game Sheet (ONLY if valid)
            if (isValid) {
                const gameRef = doc(db, 'matches', gameId);
                const gameSnap = await getDoc(gameRef);

                if (gameSnap.exists()) {
                    const gameData = gameSnap.data();
                    const nameToRemove = volunteerName || user.displayName || "";

                    const updatedRoles = (gameData.roles || []).map((role: any) => {
                        if (role.id === roleId) {
                            return {
                                ...role,
                                volunteers: role.volunteers.filter((v: string) => v !== nameToRemove)
                            };
                        }
                        return role;
                    });

                    await updateDoc(gameRef, { roles: updatedRoles });
                }
            }

            // 2. Delete from user profile (ALWAYS)
            await deleteDoc(doc(db, `users/${user.uid}/registrations/${regId}`));

            setRegistrations(prev => prev.filter(r => r.id !== regId));
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression");
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/50 flex items-center justify-center text-3xl font-bold shadow-lg">
                            {user.photoURL ? (
                                <img src={user.photoURL} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                                user.displayName?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{user.displayName}</h2>
                            <p className="text-indigo-100">{user.email}</p>
                            <div className="flex gap-3 mt-4">
                                <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-medium backdrop-blur-sm border border-white/10">
                                    {registrations.length} Inscriptions
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="ml-auto p-2 hover:bg-white/10 rounded-full transition-colors self-start -mt-2 -mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span>📅</span> Mes Prochaines Missions
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl shadow-sm animate-pulse" />)}
                        </div>
                    ) : registrations.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-100 border-dashed">
                            <p className="text-slate-400">Aucune inscription pour le moment.</p>
                            <button onClick={onClose} className="mt-4 text-indigo-600 font-bold hover:underline">
                                Parcourir les matchs
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {registrations.map(reg => {
                                const isValid = reg.isValid !== false; // Default true if undefined
                                return (
                                    <div key={reg.id} className={`p-4 rounded-2xl shadow-sm border flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow group
                                    ${isValid ? 'bg-white border-slate-100' : 'bg-red-50 border-red-100 opacity-90'}
                                `}>
                                        {/* Date Box */}
                                        <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center
                                        ${isValid ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-500'}
                                    `}>
                                            <span className="text-xs font-bold uppercase">
                                                {reg.gameDate ? (reg.gameDate.includes('-') ? 'DATE' : reg.gameDate.split(' ')[0].substring(0, 3)) : '???'}
                                            </span>
                                            <span className="text-xl font-black">
                                                {reg.gameDate ? (reg.gameDate.includes('-') ? reg.gameDate.split('-')[2] : reg.gameDate.match(/\d+/)?.[0]) : '?'}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide
                                                ${isValid ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}
                                            `}>
                                                    {reg.roleName}
                                                </span>
                                                {!isValid && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                                        ⚠️ Expiré / Invalide
                                                    </span>
                                                )}
                                                <span className="text-slate-400 text-xs flex items-center gap-1">
                                                    <ClockIcon className="w-3 h-3" /> {reg.gameTime || 'Heure à définir'}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-slate-800">
                                                {reg.team} vs {reg.opponent}
                                            </h4>
                                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                <LocationIcon className="w-3 h-3" /> {reg.location}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex-shrink-0 flex sm:flex-col gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDelete(reg.id, reg.gameId, reg.roleId, reg.volunteerName, isValid)}
                                                className={`p-2 rounded-lg transition-colors
                                                ${isValid ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}
                                            `}
                                                title={isValid ? "Annuler l'inscription" : "Supprimer de l'historique"}
                                            >
                                                <DeleteIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Carpool Section (Placeholder for V2) */}
                    <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
                        <span>🚗</span> Covoiturage
                    </h3>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-800 text-sm">
                        La gestion de vos covoiturages arrive bientôt ici !
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProfileModal;
