import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOut, onAuthStateChanged } from '../utils/authStore';
import { GoogleIcon, LogoutIcon, UserIcon } from './Icons';
import UserAuthModal from './UserAuthModal';
import ProfileModal from './ProfileModal';
import { UserRegistration, Game } from '../types';

interface UserProfileProps {
    onLogin?: (user: User) => void;
    onLogout?: () => void;
    registrations: UserRegistration[];
    games: Game[];
    onUnsubscribe: (gameId: string, roleId: string, volunteerName: string) => Promise<void>;
    onRemoveCarpool: (gameId: string, entryId: string) => Promise<void>;
    onToast: (message: string, type: 'success' | 'error' | 'info') => void;
    allTeams?: string[];
    favoriteTeams?: string[];
    onToggleFavorite?: (team: string) => Promise<void>;
}

const UserProfile: React.FC<UserProfileProps> = ({
    onLogin,
    onLogout,
    registrations = [],
    games = [],
    onUnsubscribe = async () => { },
    onRemoveCarpool = async () => { },
    onToast = () => { },
    allTeams = [],
    favoriteTeams = [],
    onToggleFavorite = async () => { }
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
            if (currentUser && onLogin) onLogin(currentUser);
            if (!currentUser && onLogout) onLogout();
        });
        return () => unsubscribe();
    }, [onLogin, onLogout]);

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
            setIsAuthModalOpen(false); // Close modal on success
            onToast('Connexion réussie !', 'success');
        } catch (error) {
            console.error("Login failed", error);
            onToast('Erreur de connexion Google', 'error');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            setShowMenu(false);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (loading) return <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />;

    if (!user) {
        return (
            <>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsAuthModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 
                               text-white font-medium rounded-full border border-white/20 
                               transition-all shadow-sm hover:shadow-md ml-2 backdrop-blur-sm"
                    title="Espace Bénévoles"
                >
                    <div className="w-5 h-5 opacity-90">
                        <UserIcon />
                    </div>
                    <span className="hidden sm:inline">Connexion / Inscription</span>
                </button>

                <UserAuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    onGoogleLogin={handleGoogleLogin}
                    onToast={onToast}
                />
            </>
        );

    }

    return (
        <div className="relative ml-2 z-50">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
                {user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.displayName || 'Utilisateur'}
                        className="w-8 h-8 rounded-full object-cover shadow-sm bg-white"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                        {user.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                )}
            </button>

            {/* Backdrop to close menu */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowMenu(false)}
                />
            )}

            {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 
                                transform origin-top-right transition-all animate-in fade-in zoom-in-95 overflow-hidden z-50">
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.displayName}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    {/* Mon Espace Bénévole */}
                    <div className="p-1">
                        <button
                            onClick={() => {
                                setIsProfileOpen(true); // Open modal FIRST
                                setShowMenu(false); // Then close menu
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 font-bold 
                                       hover:bg-indigo-50 rounded-lg transition-colors text-left"
                        >
                            <UserIcon className="w-4 h-4" />
                            Mon Espace Bénévole
                        </button>
                    </div>

                    <div className="p-1 border-t border-slate-100">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 
                                       hover:bg-red-50 rounded-lg transition-colors text-left"
                        >
                            <LogoutIcon className="w-4 h-4" />
                            Se déconnecter
                        </button>
                    </div>
                </div>
            )}

            {user && (
                <ProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    user={user}
                    registrations={registrations}
                    games={games}
                    onUnsubscribe={onUnsubscribe}
                    onRemoveCarpool={onRemoveCarpool}
                    onToast={onToast}
                    allTeams={allTeams}
                    favoriteTeams={favoriteTeams}
                    onToggleFavorite={onToggleFavorite}
                />
            )}
        </div>
    );
};

export default UserProfile;
