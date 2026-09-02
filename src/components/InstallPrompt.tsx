import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles } from 'lucide-react';

const DISMISS_KEY = 'scba-pwa-install-dismissed-v4';
const DISMISS_DURATION_MS = 2 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
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

type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
    return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

function wasDismissedRecently(): boolean {
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  return Date.now() - parseInt(ts, 10) < DISMISS_DURATION_MS;
}

const InstallPrompt: React.FC = () => {
  const [hasNativePrompt, setHasNativePrompt] = useState(
    typeof window !== 'undefined' && window.__pwaInstallPrompt != null,
  );
  const [show, setShow] = useState(false);
  const [reloadActive, setReloadActive] = useState(false);
  const [platform] = useState<Platform>(detectPlatform);

  useEffect(() => {
    if (isAlreadyInstalled()) return;

    // Récupérer le prompt capturé tôt dans index.html
    if (window.__pwaInstallPrompt) setHasNativePrompt(true);

    const handlePromptReady = () => {
      if (window.__pwaInstallPrompt) setHasNativePrompt(true);
      if (!wasDismissedRecently()) setShow(true);
    };
    window.addEventListener('pwa-prompt-ready', handlePromptReady);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e as BeforeInstallPromptEvent;
      setHasNativePrompt(true);
      if (!wasDismissedRecently()) setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const onInstalled = () => {
      setShow(false);
      setHasNativePrompt(false);
      window.__pwaInstallPrompt = null;
    };
    window.addEventListener('appinstalled', onInstalled);

    // Coordination avec ReloadPrompt : se masquer si ReloadPrompt est visible
    const onReloadVisible = () => setReloadActive(true);
    const onReloadHidden = () => setReloadActive(false);
    window.addEventListener('pwa-reload-visible', onReloadVisible);
    window.addEventListener('pwa-reload-hidden', onReloadHidden);

    // Déclencheur manuel (footer / menu profil)
    const handleManualOpen = () => setShow(true);
    window.addEventListener('pwa-open-install', handleManualOpen);

    // Affichage automatique :
    // - iOS : toujours (guide Partager → Écran d'accueil)
    // - Android/Desktop : uniquement si le prompt natif est capturé
    let timer: NodeJS.Timeout | null = null;
    if (!wasDismissedRecently()) {
      if (platform === 'ios') {
        timer = setTimeout(() => setShow(true), 1000);
      }
      // Android & Desktop : le show est déclenché par handleBeforeInstall ci-dessus
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('pwa-reload-visible', onReloadVisible);
      window.removeEventListener('pwa-reload-hidden', onReloadHidden);
      window.removeEventListener('pwa-open-install', handleManualOpen);
    };
  }, [platform]);

  const handleInstallClick = async () => {
    if (platform === 'ios') {
      // Impossible de déclencher programmatiquement sur iOS
      // Le guide est déjà affiché dans le rendu ci-dessous
      return;
    }

    const promptEvent = window.__pwaInstallPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        window.__pwaInstallPrompt = null;
        setHasNativePrompt(false);
        if (outcome === 'accepted') {
          setShow(false);
        }
      } catch {
        // prompt() déjà consommé — rien à faire
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  if (isAlreadyInstalled()) return null;

  // Ne pas afficher si ReloadPrompt est actif (éviter la superposition)
  const isVisible = show && !reloadActive;

  // Sur Android et Desktop : ne montrer QUE si le prompt natif est disponible (1-clic direct)
  // Sur iOS : toujours montrer le guide
  if (platform !== 'ios' && !hasNativePrompt && show) {
    // Pas de prompt natif → pas de popup (pas de guide "3 points")
    // L'utilisateur peut toujours cliquer sur "Installer l'app" dans le footer/profil
    // et ça réapparaîtra quand le prompt sera capturé
  }
  const shouldRender = platform === 'ios' || hasNativePrompt;

  return (
    <aside aria-label="Installation de l'application SCBA Bénévoles">
      <AnimatePresence>
        {isVisible && shouldRender && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="fixed bottom-24 left-3.5 right-3.5 md:bottom-6 md:right-6 md:left-auto md:w-[400px] z-[99997]"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="bg-slate-900/98 text-white p-5 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-slate-700/80 backdrop-blur-2xl">
              {/* En-tête */}
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
                      {platform === 'ios'
                        ? "Ajoutez l'app sur votre écran d'accueil"
                        : "Installer l'application sur votre appareil ?"}
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

              {/* ========== iOS : Guide visuel (seule option possible) ========== */}
              {platform === 'ios' && (
                <div className="bg-slate-800/95 rounded-2xl p-3.5 mb-3 text-xs text-slate-200 space-y-2.5 border border-blue-500/40">
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
                      en bas de l'écran
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
                </div>
              )}

              {/* ========== Android & Desktop : Bouton 1-clic natif ========== */}
              {platform !== 'ios' && hasNativePrompt && (
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-[#272890] hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 mb-2.5 text-sm cursor-pointer"
                >
                  <Download className="w-4.5 h-4.5" />
                  Installer l'application
                </button>
              )}

              {/* Bouton secondaire */}
              <button
                onClick={handleDismiss}
                className="w-full text-slate-400 hover:text-slate-200 text-xs py-1.5 transition-colors cursor-pointer text-center"
              >
                {platform === 'ios' ? "J'ai compris" : 'Plus tard'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default InstallPrompt;
