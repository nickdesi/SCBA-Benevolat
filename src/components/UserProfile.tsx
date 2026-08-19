import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOut, onAuthStateChanged } from '../utils/authStore';
import { LogoutIcon, UserIcon } from './Icons';

const UserAuthModal = lazy(() => import('./UserAuthModal'));

interface UserProfileProps {
  onLogin?: (user: User) => void;
  onLogout?: () => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
  isAdmin?: boolean;
  onOpenAdminStats?: () => void;
  onOpenProfile: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  onLogin,
  onLogout,
  onToast = () => {},
  isAdmin = false,
  onOpenAdminStats = () => {},
  onOpenProfile,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser && onLogin) onLogin(currentUser);
      if (!currentUser && onLogout) onLogout();
    });
    return () => unsubscribe();
  }, [onLogin, onLogout]);

  // Click outside and Escape key handler to close the dropdown menu
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      setIsAuthModalOpen(false); // Close modal on success
      onToast('Connexion réussie !', 'success');
    } catch (error: any) {
      console.error('Login failed', error);
      onToast(error?.message || 'Erreur de connexion Google. Veuillez réessayer.', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setShowMenu(false);
    } catch (error) {
      console.error('Logout failed', error);
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

        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          {isAuthModalOpen && (
            <UserAuthModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              onGoogleLogin={handleGoogleLogin}
              onToast={onToast}
            />
          )}
        </Suspense>
      </>
    );
  }

  return (
    <div ref={menuRef} className="relative ml-2 z-50">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Utilisateur'}
            className="w-8 h-8 rounded-full object-cover shadow-sm bg-white"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </button>

      {showMenu && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700
                                transform origin-top-right transition-all animate-in fade-in zoom-in-95 overflow-hidden z-50 backdrop-blur-xl"
        >
          <div className="p-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {user.displayName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
          </div>

          {/* Mon Espace Bénévole */}
          <div className="p-1.5 space-y-1">
            <button
              onClick={() => {
                onOpenProfile(); // Open global modal
                setShowMenu(false); // Then close menu
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#3629e1] dark:text-indigo-400 font-bold
                                       hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors text-left"
            >
              <UserIcon className="w-4 h-4" />
              Mon Espace Bénévole
            </button>

            {/* Admin Stats Link */}
            {isAdmin && (
              <button
                onClick={() => {
                  onOpenAdminStats();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 font-bold
                                           hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 text-slate-500 dark:text-slate-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
                  />
                </svg>
                Administration
              </button>
            )}
          </div>

          <div className="p-1.5 border-t border-slate-100 dark:border-slate-700/60">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 font-bold
                                       hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors text-left"
            >
              <LogoutIcon className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      )}

      {/* Removed local ProfileModal - now handled by App.tsx via onOpenProfile */}
    </div>
  );
};

export default UserProfile;
