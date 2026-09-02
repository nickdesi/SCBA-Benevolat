import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

const DISMISS_KEY = 'scba-pwa-install-dismissed';
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 jours

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isAlreadyInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOSDevice =
    /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIOSDevice || isIPadOS;
}

function isIOSSafari(): boolean {
  if (!isIOS()) return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}

function wasDismissedRecently(): boolean {
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  return Date.now() - parseInt(ts, 10) < DISMISS_DURATION_MS;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    if (isAlreadyInstalled() || wasDismissedRecently()) return;

    // Fermer si l'application est installée
    const onInstalled = () => setShow(false);
    window.addEventListener('appinstalled', onInstalled);

    if (isIOSSafari()) {
      setIsIOSDevice(true);
      // Léger délai d'attente pour ne pas gêner le premier chargement
      const timer = setTimeout(() => setShow(true), 3500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('appinstalled', onInstalled);
      };
    } else {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShow(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }
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

  return (
    <aside aria-label="Invitation d'installation PWA">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-24 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:w-[400px] z-[99997]"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="bg-slate-900/95 text-white p-5 rounded-3xl shadow-2xl border border-slate-700/80 backdrop-blur-xl">
              {/* En-tête */}
              <div className="flex items-start justify-between gap-3 mb-3.5">
                <div className="flex items-center gap-3">
                  <picture>
                    <source srcSet="/pwa-192x192.webp" type="image/webp" />
                    <img
                      src="/pwa-192x192.png"
                      alt="SCBA Bénévoles"
                      className="w-12 h-12 rounded-2xl flex-shrink-0 shadow-md border border-white/10"
                    />
                  </picture>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-white">Installez l'app</h3>
                      <span className="text-xs bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                        Hors-ligne
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Accès instantané même sans réseau au gymnase.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contenu spécifique iOS Safari */}
              {isIOSDevice ? (
                <div className="bg-slate-800/80 rounded-2xl p-3.5 mb-3.5 text-xs text-slate-200 space-y-2.5 border border-slate-700/50">
                  <div className="font-semibold text-slate-100 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <span>Installer sur iPhone / iPad :</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 font-bold text-[11px] flex-shrink-0">
                      1
                    </span>
                    <span>
                      Appuyez sur <span className="font-bold text-white">Partager</span>{' '}
                      <Share className="inline-block w-3.5 h-3.5 mx-1 text-blue-400 -mt-0.5" /> dans
                      la barre Safari
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 font-bold text-[11px] flex-shrink-0">
                      2
                    </span>
                    <span>
                      Sélectionnez{' '}
                      <span className="font-bold text-white">« Sur l'écran d'accueil »</span>{' '}
                      <PlusSquare className="inline-block w-3.5 h-3.5 mx-1 text-blue-400 -mt-0.5" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 font-bold text-[11px] flex-shrink-0">
                      3
                    </span>
                    <span>
                      Touchez <span className="font-bold text-white">Ajouter</span> en haut à droite
                    </span>
                  </div>
                </div>
              ) : (
                /* Bouton Android / Chromium */
                <button
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-[#272890] hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mb-2 text-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Installer l'application
                </button>
              )}

              <button
                onClick={handleDismiss}
                className="w-full text-slate-400 hover:text-slate-200 text-xs py-1.5 transition-colors cursor-pointer text-center"
              >
                {isIOSDevice ? "J'ai compris" : 'Plus tard'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default InstallPrompt;
