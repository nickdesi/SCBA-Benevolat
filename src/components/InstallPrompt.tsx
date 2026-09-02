import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share,
  PlusSquare,
  X,
  Smartphone,
  Sparkles,
  Laptop,
  ShieldCheck,
} from 'lucide-react';

const DISMISS_KEY = 'scba-pwa-install-dismissed-v11';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
  }
  interface Navigator {
    brave?: {
      isBrave: () => Promise<boolean>;
    };
  }
}

function isAlreadyInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function isAppleDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function wasDismissedRecently(): boolean {
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  return Date.now() - parseInt(ts, 10) < DISMISS_DURATION_MS;
}

const InstallPrompt: React.FC = () => {
  const [show, setShow] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isBrave, setIsBrave] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (isAlreadyInstalled()) return;

    const isApple = isAppleDevice();
    setIsIOS(isApple);

    if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
      navigator.brave.isBrave().then((b) => {
        if (b) setIsBrave(true);
      });
    }

    const handlePromptReady = () => {
      if (!wasDismissedRecently()) setShow(true);
    };
    window.addEventListener('pwa-prompt-ready', handlePromptReady);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e as BeforeInstallPromptEvent;
      if (!wasDismissedRecently()) setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const onInstalled = () => {
      setShow(false);
      window.__pwaInstallPrompt = null;
    };
    window.addEventListener('appinstalled', onInstalled);

    // Déclencheur manuel (footer / profil)
    const handleManualOpen = () => {
      setShow(true);
      setShowGuide(false);
    };
    window.addEventListener('pwa-open-install', handleManualOpen);

    // Affichage automatique
    let timer: NodeJS.Timeout | null = null;
    if (!wasDismissedRecently()) {
      timer = setTimeout(() => {
        setShow(true);
      }, 600);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('pwa-open-install', handleManualOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowGuide(true);
      return;
    }

    const promptEvent = window.__pwaInstallPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        window.__pwaInstallPrompt = null;
        if (outcome === 'accepted') {
          setShow(false);
          return;
        }
      } catch (err) {
        console.warn('[PWA Install] Erreur lors de l’ouverture du prompt:', err);
        setShowGuide(true);
      }
    } else {
      // Si le prompt natif n'est pas disponible (Brave shields, Firefox, etc.)
      setShowGuide(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
    setShowGuide(false);
  };

  if (isAlreadyInstalled()) return null;

  return (
    <aside aria-label="Installation de l'application SCBA Bénévoles">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="fixed bottom-24 left-3.5 right-3.5 md:bottom-6 md:right-6 md:left-auto md:w-[400px] z-[99997]"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="bg-slate-900/98 text-white p-5 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-slate-700/80 backdrop-blur-2xl">
              {/* En-tête : Logo + Titre + Bouton Fermer */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <picture>
                    <source srcSet="/pwa-192x192.webp" type="image/webp" />
                    <img
                      src="/pwa-192x192.png"
                      alt="Logo SCBA"
                      className="w-12 h-12 rounded-2xl flex-shrink-0 shadow-md border border-white/15"
                    />
                  </picture>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-sport font-black text-base tracking-wide text-white uppercase">
                        SCBA Bénévoles
                      </h3>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Hors-ligne
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Installer l'application sur votre appareil ?
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* ============================================================ */}
              {/* GUIDE VISUEL iOS (Si demandé ou appareil Apple)             */}
              {/* ============================================================ */}
              {isIOS && showGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-slate-800/95 rounded-2xl p-3.5 mb-3 text-xs text-slate-200 space-y-2.5 border border-blue-500/40"
                >
                  <div className="font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <span>Sur iPhone / iPad :</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/40 text-blue-300 font-bold text-[11px] flex-shrink-0">
                      1
                    </span>
                    <span>
                      Touchez{' '}
                      <span className="font-bold text-white">
                        Partager{' '}
                        <Share className="inline-block w-3.5 h-3.5 mx-0.5 text-blue-400 -mt-0.5" />
                      </span>{' '}
                      en bas de Safari
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/40 text-blue-300 font-bold text-[11px] flex-shrink-0">
                      2
                    </span>
                    <span>
                      Sélectionnez{' '}
                      <span className="font-bold text-white">
                        « Sur l'écran d'accueil »{' '}
                        <PlusSquare className="inline-block w-3.5 h-3.5 mx-0.5 text-blue-400 -mt-0.5" />
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/40 text-blue-300 font-bold text-[11px] flex-shrink-0">
                      3
                    </span>
                    <span>
                      Touchez <span className="font-bold text-white">Ajouter</span> ✅
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* GUIDE DE SECOURS (Brave / Navigateurs sans prompt natif)     */}
              {/* ============================================================ */}
              {!isIOS && showGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-slate-800/95 rounded-2xl p-3.5 mb-3 text-xs text-slate-200 space-y-2 border border-orange-500/40"
                >
                  <div className="flex items-center gap-2 font-bold text-orange-400">
                    {isBrave ? (
                      <ShieldCheck className="w-4 h-4 text-orange-400" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{isBrave ? 'Sur Brave :' : 'Sur votre navigateur :'}</span>
                  </div>
                  <p className="text-slate-300 leading-snug">
                    Touchez le menu <span className="font-bold text-white">⋮</span> puis
                    sélectionnez{' '}
                    <span className="font-bold text-white">« Installer l'application »</span> ou{' '}
                    <span className="font-bold text-white">« Ajouter à l'écran d'accueil »</span>.
                  </p>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* BOUTON PRINCIPAL                                             */}
              {/* ============================================================ */}
              {!showGuide ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-[#272890] hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 mb-2.5 text-sm cursor-pointer"
                >
                  <Download className="w-4.5 h-4.5" />
                  Installer l'application
                </button>
              ) : (
                <button
                  onClick={handleDismiss}
                  className="w-full bg-slate-800 hover:bg-slate-750 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 mb-2 text-sm cursor-pointer border border-slate-700"
                >
                  J'ai compris
                </button>
              )}

              {/* Bouton secondaire */}
              {!showGuide && (
                <button
                  onClick={handleDismiss}
                  className="w-full text-slate-400 hover:text-slate-200 text-xs py-1.5 transition-colors cursor-pointer text-center"
                >
                  Plus tard
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default InstallPrompt;
