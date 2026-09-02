import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, PlusSquare, X, Smartphone, MoreVertical, Sparkles } from 'lucide-react';

const DISMISS_KEY = 'scba-pwa-install-dismissed-v3';
const DISMISS_DURATION_MS = 2 * 24 * 60 * 60 * 1000; // 2 jours de répit après clic "Plus tard"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isAlreadyInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function getPlatformInfo() {
  if (typeof window === 'undefined') {
    return { isIOS: false, isSafari: false, isAndroid: false, isMobile: false };
  }
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || window.innerWidth < 768;

  return { isIOS, isSafari, isAndroid, isMobile };
}

function wasDismissedRecently(): boolean {
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  return Date.now() - parseInt(ts, 10) < DISMISS_DURATION_MS;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState({
    isIOS: false,
    isSafari: false,
    isAndroid: false,
    isMobile: false,
  });

  useEffect(() => {
    const info = getPlatformInfo();
    setPlatform(info);

    // Si déjà lancé en mode standalone / PWA installée, ne rien afficher
    if (isAlreadyInstalled()) return;

    // Fermer si l'application vient d'être installée
    const onInstalled = () => {
      setShow(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    // Écouteur pour déclenchement manuel (ex: clic sur "Installer l'app" dans Footer ou Profil)
    const handleManualOpen = () => {
      setShow(true);
    };
    window.addEventListener('pwa-open-install', handleManualOpen);

    // Capture standard de l'événement beforeinstallprompt (Chromium / Android / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!wasDismissedRecently()) {
        setShow(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Affichage automatique réactif sur mobile (iOS et Android) si non refusé récemment
    let timer: NodeJS.Timeout | null = null;
    if (info.isMobile && !wasDismissedRecently()) {
      timer = setTimeout(() => {
        setShow(true);
      }, 1200);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('pwa-open-install', handleManualOpen);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setShow(false);
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
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
            className="fixed bottom-24 left-3.5 right-3.5 md:bottom-6 md:right-6 md:left-auto md:w-[420px] z-[99997]"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="bg-slate-900/98 text-white p-4.5 sm:p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-700/80 backdrop-blur-2xl">
              {/* En-tête avec logo & titre */}
              <div className="flex items-start justify-between gap-3 mb-3.5">
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
                    <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                      {platform.isIOS
                        ? "Ajoutez l'app sur votre iPhone / iPad pour un accès instantané au gymnase."
                        : platform.isAndroid
                          ? "Installez l'app sur votre smartphone Android pour l'utiliser sans connexion."
                          : "Installez l'application sur votre appareil pour l'utiliser sans connexion."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* ============================================================ */}
              {/* 1. CAS iOS (iPhone / iPad - Safari ou autre navigateur iOS)  */}
              {/* ============================================================ */}
              {platform.isIOS ? (
                <div className="bg-slate-800/90 rounded-2xl p-3.5 mb-3.5 text-xs text-slate-200 space-y-2.5 border border-slate-700/60">
                  <div className="font-bold text-slate-100 flex items-center gap-2 text-xs">
                    <Smartphone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>
                      {platform.isSafari
                        ? 'Installation sur iOS (Safari) :'
                        : 'Installation sur iPhone / iPad :'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 font-bold text-[11px] flex-shrink-0">
                      1
                    </span>
                    <span>
                      Appuyez sur <span className="font-bold text-white">Partager</span>{' '}
                      <Share className="inline-block w-3.5 h-3.5 mx-1 text-blue-400 -mt-0.5" /> dans
                      la barre du navigateur
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 font-bold text-[11px] flex-shrink-0">
                      2
                    </span>
                    <span>
                      Faites défiler et sélectionnez{' '}
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
                      ✅
                    </span>
                  </div>
                </div>
              ) : deferredPrompt ? (
                /* ============================================================ */
                /* 2. CAS Android / Chromium avec prompt natif 1-clic capturé   */
                /* ============================================================ */
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-[#272890] hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 mb-2 text-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Installer l'application
                </button>
              ) : platform.isAndroid ? (
                /* ============================================================ */
                /* 3. CAS Android sans prompt automatique immédiat              */
                /* ============================================================ */
                <div className="bg-slate-800/90 rounded-2xl p-3.5 mb-3.5 text-xs text-slate-200 space-y-2.5 border border-slate-700/60">
                  <div className="font-bold text-slate-100 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Installation sur Android :</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 font-bold text-[11px] flex-shrink-0">
                      1
                    </span>
                    <span>
                      Appuyez sur le menu{' '}
                      <MoreVertical className="inline-block w-3.5 h-3.5 mx-0.5 text-emerald-400 -mt-0.5" />{' '}
                      (trois points en haut à droite de Chrome/Brave/Edge)
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 font-bold text-[11px] flex-shrink-0">
                      2
                    </span>
                    <span>
                      Sélectionnez{' '}
                      <span className="font-bold text-white">« Installer l'application »</span> ou{' '}
                      <span className="font-bold text-white">« Ajouter à l'écran d'accueil »</span>
                    </span>
                  </div>
                </div>
              ) : (
                /* ============================================================ */
                /* 4. CAS Desktop / Autre navigateur                            */
                /* ============================================================ */
                <div className="bg-slate-800/90 rounded-2xl p-3 mb-3 text-xs text-slate-200 space-y-2 border border-slate-700/60">
                  <div className="font-bold text-slate-100 flex items-center gap-2">
                    <MoreVertical className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Installation :</span>
                  </div>
                  <p className="text-slate-300">
                    Cliquez sur l'icône d'installation dans la barre d'adresse de votre navigateur
                    ou via le menu pour ajouter l'application.
                  </p>
                </div>
              )}

              {/* Bouton de fermeture */}
              <button
                onClick={handleDismiss}
                className="w-full text-slate-400 hover:text-slate-200 text-xs py-1.5 transition-colors cursor-pointer text-center"
              >
                {platform.isIOS || (!deferredPrompt && platform.isAndroid)
                  ? "J'ai compris"
                  : 'Plus tard'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default InstallPrompt;
