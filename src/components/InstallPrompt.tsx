import React, { useEffect, useState } from 'react';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 jours

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isAlreadyInstalled(): boolean {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true
    );
}

/** Téléphones iPhone sans iPad, en Safari uniquement (les autres navigateurs iOS ne supportent pas l'installation) */
function isIOSPhoneSafari(): boolean {
    const ua = navigator.userAgent;
    const isIOSPhone = /iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
    return isIOSPhone && isSafari;
}

/** Téléphone Android (le UA Android + Mobile exclut les tablettes Android) */
function isAndroidPhone(): boolean {
    const ua = navigator.userAgent;
    return /Android/.test(ua) && /Mobile/.test(ua);
}

function wasDismissedRecently(): boolean {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < DISMISS_DURATION_MS;
}

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [show, setShow] = useState(false);
    const [ios, setIos] = useState(false);

    useEffect(() => {
        if (isAlreadyInstalled() || wasDismissedRecently()) return;

        if (isIOSPhoneSafari()) {
            setIos(true);
            // Délai pour ne pas gêner le chargement initial
            const t = setTimeout(() => setShow(true), 4000);
            return () => clearTimeout(t);
        } else if (isAndroidPhone()) {
            const handler = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e as BeforeInstallPromptEvent);
                setShow(true);
            };
            window.addEventListener('beforeinstallprompt', handler);
            return () => window.removeEventListener('beforeinstallprompt', handler);
        }
        // Tablettes, desktop → rien
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (outcome === 'accepted') {
            setShow(false);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-6 md:right-6 md:left-auto md:translate-x-0 z-[99997] w-[92%] md:w-96">
            <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-2xl border border-slate-600 animate-fade-in-up">
                {/* En-tête avec icône */}
                <div className="flex items-start gap-3 mb-3">
                    <picture>
                        <source srcSet="/pwa-192x192.webp" type="image/webp" />
                        <img
                            src="/pwa-192x192.png"
                            alt="SCBA"
                            className="w-12 h-12 rounded-xl flex-shrink-0 shadow-md"
                        />
                    </picture>
                    <div>
                        <h3 className="font-bold text-base leading-tight">
                            Installez l'application 📲
                        </h3>
                        <p className="text-sm text-slate-300 mt-0.5">
                            Accédez à SCBA Bénévoles depuis votre écran d'accueil, comme une vraie appli — sans passer par le navigateur.
                        </p>
                    </div>
                </div>

                {/* Instructions iOS */}
                {ios ? (
                    <div className="bg-slate-700/60 rounded-xl p-3 mb-3 text-sm text-slate-200 space-y-2">
                        <p className="font-semibold text-white">En 3 étapes faciles :</p>
                        <div className="flex items-start gap-2">
                            <span className="text-base flex-shrink-0">1️⃣</span>
                            <span>Appuyez sur <span className="font-bold">Partager</span> <span className="inline-block bg-slate-600 rounded px-1.5 py-0.5 text-xs font-mono">⬆</span> en bas de Safari</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-base flex-shrink-0">2️⃣</span>
                            <span>Faites défiler et choisissez <span className="font-bold">« Sur l'écran d'accueil »</span></span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-base flex-shrink-0">3️⃣</span>
                            <span>Appuyez sur <span className="font-bold">Ajouter</span> en haut à droite ✅</span>
                        </div>
                    </div>
                ) : (
                    /* Bouton Android / Chrome */
                    <button
                        onClick={handleInstall}
                        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl transition-colors mb-2"
                    >
                        Installer l'application
                    </button>
                )}

                <button
                    onClick={handleDismiss}
                    className="w-full text-slate-400 hover:text-slate-200 text-sm py-1.5 transition-colors"
                >
                    {ios ? 'Fermer' : 'Plus tard'}
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
