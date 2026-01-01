import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { GoogleIcon, AppleIcon } from './Icons';
import { signIn, signUp } from '../utils/authStore';

interface UserAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoogleLogin: () => void;
}

type AuthView = 'menu' | 'login' | 'signup';

const UserAuthModal: React.FC<UserAuthModalProps> = ({ isOpen, onClose, onGoogleLogin }) => {
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
                if (!name.trim()) throw new Error("Le nom est obligatoire");
                await signUp(email, password, name);
            }
            handleClose(); // Close on success
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const renderMenu = () => (
        <div className="space-y-4">
            {/* Option 1: Google Login */}
            <button
                onClick={onGoogleLogin}
                className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 
                             hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700 
                             rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
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
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 border-slate-200 
                                 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 
                                 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                >
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </div>
                    <span className="font-bold text-sm">Se connecter</span>
                </button>

                <button
                    onClick={() => setView('signup')}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 border-slate-200 
                                 hover:border-purple-500 hover:bg-purple-50 text-slate-700 hover:text-purple-700 
                                 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                >
                    <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                    </div>
                    <span className="font-bold text-sm">Créer un compte</span>
                </button>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase tracking-wider font-semibold">ou</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Option 3: Guest */}
            <button
                onClick={handleClose}
                className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-colors"
            >
                Continuer en tant qu'invité
            </button>
        </div>
    );

    const renderForm = () => (
        <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {view === 'signup' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                        placeholder="Ex: Pierre Martin"
                        required
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    placeholder="votre@email.com"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                    required
                    minLength={6}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl 
                         hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
                {loading ? 'Chargement...' : (view === 'login' ? 'Se connecter' : 'Créer un compte')}
            </button>

            {/* Social Logins inside Form */}
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase tracking-wider font-semibold">ou avec</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
                <div className="w-5 h-5"><GoogleIcon /></div>
                <span>Google</span>
            </button>

            <div className="flex justify-between items-center text-sm pt-2">
                <button
                    type="button"
                    onClick={() => setView('menu')}
                    className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                >
                    ← Retour
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setView(view === 'login' ? 'signup' : 'login');
                        setError('');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                >
                    {view === 'login' ? 'Créer un compte' : 'J\'ai déjà un compte'}
                </button>
            </div>
        </form>
    );

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />

            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all overflow-hidden border border-slate-100">
                <div className="relative px-6 py-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white text-center">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.3)_0%,transparent_60%)] animate-pulse" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-1">
                            {view === 'menu' ? 'Espace Bénévoles' : (view === 'login' ? 'Connexion' : 'Inscription')}
                        </h2>
                        <p className="text-slate-300 text-xs">
                            {view === 'menu'
                                ? 'Sauvegardez votre planning sur tous vos appareils.'
                                : (view === 'login' ? 'Entrez vos identifiants' : 'Rejoignez la team SCBA !')}
                        </p>
                    </div>

                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors z-[20]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {view === 'menu' ? renderMenu() : renderForm()}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UserAuthModal;
