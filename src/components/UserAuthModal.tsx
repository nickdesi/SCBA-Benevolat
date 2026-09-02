import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Lock, User, X, LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { GoogleIcon } from './Icons';
import { signIn, signUp, resetUserPassword } from '../utils/authStore';
import useScrollLock from '../hooks/useScrollLock';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type AuthView = 'menu' | 'login' | 'signup' | 'forgot-password';

const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  onGoogleLogin,
  onToast,
}) => {
  useScrollLock(isOpen);
  const [view, setView] = useState<AuthView>('menu');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setView('menu');
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (view === 'login') {
        await signIn(email, password);
      } else {
        if (!name.trim()) throw new Error('Le nom est obligatoire');
        await signUp(email, password, name);
      }
      onToast('Connexion réussie !', 'success');
      handleClose(); // Close on success
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim()) throw new Error('Veuillez renseigner une adresse email');
      await resetUserPassword(email);
      onToast('Un email de réinitialisation vous a été envoyé.', 'success');
      setView('login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMenu = () => (
    <div className="space-y-4">
      {/* Option 1: Google Login */}
      <button
        onClick={onGoogleLogin}
        className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600
                             hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300
                             rounded-xl transition-all duration-150 shadow-sm hover:shadow-md"
      >
        <div className="w-6 h-6 group-hover:scale-110 transition-transform">
          <GoogleIcon />
        </div>
        <div className="text-left">
          <span className="block font-bold text-base">Continuer avec Google</span>
          <span className="block text-xs opacity-75">Recommandé</span>
        </div>
      </button>

      {/* Option 2: Email Login */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setView('login')}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600
                                 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300
                                 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md group"
        >
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/20 rounded-full text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
            <LogIn className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm">Se connecter</span>
        </button>

        <button
          onClick={() => setView('signup')}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600
                                 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-purple-300
                                 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md group"
        >
          <div className="p-2.5 bg-purple-100 dark:bg-purple-500/20 rounded-full text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
            <UserPlus className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm">Créer un compte</span>
        </button>
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-600"></div>
        <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">
          ou
        </span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-600"></div>
      </div>

      {/* Option 3: Guest */}
      <button
        onClick={handleClose}
        className="w-full px-6 py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors hover:shadow-inner"
      >
        Continuer en tant qu'invité
      </button>
    </div>
  );

  const inputClasses =
    'w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium bg-white dark:bg-slate-700';

  const renderForm = () => (
    <form
      onSubmit={view === 'forgot-password' ? handlePasswordReset : handleEmailAuth}
      className="space-y-4"
    >
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-200 dark:border-red-800/60 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {view === 'signup' && (
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
            Nom complet
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
              placeholder="Ex: Pierre Martin"
              required
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasses}
            placeholder="votre@email.com"
            required
          />
        </div>
      </div>

      {view !== 'forgot-password' && (
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        </div>
      )}

      {view === 'login' && (
        <div className="flex justify-end -mt-2">
          <button
            type="button"
            onClick={() => {
              setView('forgot-password');
              setError('');
            }}
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold px-2 py-1 transition-colors"
          >
            Mot de passe oublié ?
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl
                         hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
      >
        {loading ? (
          <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : view === 'login' ? (
          'Se connecter'
        ) : view === 'signup' ? (
          'Créer un compte'
        ) : (
          'Envoyer le lien'
        )}
      </button>

      {/* Social Logins inside Form */}
      {view !== 'forgot-password' && (
        <>
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-600"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">
              ou avec
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-600"></div>
          </div>

          <button
            type="button"
            onClick={onGoogleLogin}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all"
          >
            <div className="w-5 h-5">
              <GoogleIcon />
            </div>
            <span>Google</span>
          </button>
        </>
      )}

      <div className="flex justify-between items-center text-sm pt-2">
        <button
          type="button"
          onClick={() => {
            setView(view === 'forgot-password' ? 'login' : 'menu');
            setError('');
          }}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        {view !== 'forgot-password' && (
          <button
            type="button"
            onClick={() => {
              setView(view === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            {view === 'login' ? 'Créer un compte' : "J'ai déjà un compte"}
          </button>
        )}
      </div>
    </form>
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl transform transition-all overflow-hidden border border-slate-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-8 py-8 bg-slate-900 text-white text-center overflow-hidden">
          {/* Dynamic Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90" />
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] animate-pulse" />
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1.5 tracking-tight">
              {view === 'menu'
                ? 'Espace Bénévoles'
                : view === 'login'
                  ? 'Bon retour !'
                  : view === 'forgot-password'
                    ? 'Mot de passe oublié'
                    : "Rejoindre l'équipe"}
            </h2>
            <p className="text-blue-100 text-sm font-medium">
              {view === 'menu'
                ? 'Gérez vos inscriptions et matchs.'
                : view === 'login'
                  ? 'Entrez vos identifiants pour continuer'
                  : view === 'forgot-password'
                    ? 'Saisissez votre email pour réinitialiser'
                    : 'Créez votre compte en 30 secondes'}
            </p>
          </div>

          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors z-[20]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 md:p-8">{view === 'menu' ? renderMenu() : renderForm()}</div>
      </div>
    </div>,
    document.body,
  );
};

export default UserAuthModal;
